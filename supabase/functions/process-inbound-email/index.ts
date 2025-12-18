import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * SendGrid Inbound Parse Webhook Handler
 * 
 * This edge function receives inbound emails from SendGrid Inbound Parse
 * and stores them in the company_inbound_emails table for AI agent processing.
 * 
 * SendGrid sends POST requests with multipart/form-data containing:
 * - headers: Email headers as a string
 * - dkim: DKIM verification results
 * - to: Recipient email address
 * - from: Sender email address
 * - subject: Email subject
 * - text: Plain text body
 * - html: HTML body
 * - sender_ip: IP of the sending server
 * - spam_score: Spam score
 * - attachment-info: JSON string with attachment metadata
 * - attachmentX: Binary attachment data (X = number)
 * 
 * Setup instructions:
 * 1. Configure DNS MX records to point to SendGrid
 * 2. In SendGrid dashboard, configure Inbound Parse with this webhook URL
 * 3. Store webhook secret in SENDGRID_INBOUND_SECRET environment variable
 */

interface InboundEmailData {
  company_id: string;
  mailbox_type: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  attachments: any[];
  raw_headers: any;
  sendgrid_event_id: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("SENDGRID_INBOUND_SECRET");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the form data from SendGrid
    const formData = await req.formData();
    
    const to = formData.get("to") as string;
    const from = formData.get("from") as string;
    const subject = formData.get("subject") as string;
    const text = formData.get("text") as string;
    const html = formData.get("html") as string;
    const headers = formData.get("headers") as string;
    const envelope = formData.get("envelope") as string;
    
    // Extract sender name and email
    const fromMatch = from?.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
    const fromName = fromMatch?.[1] || null;
    const fromEmail = fromMatch?.[2] || from;

    // Determine which company this email belongs to based on the recipient address
    const toEmail = to?.match(/<([^>]+)>/)?.[1] || to;
    
    // Look up company by inbound email configuration
    const { data: configData, error: configError } = await supabase
      .from("company_inbound_email_config")
      .select("company_id, billing_email, notifications_email, support_email, marketing_email, general_email")
      .eq("is_active", true);

    if (configError) {
      console.error("Error fetching company configs:", configError);
      throw configError;
    }

    // Find matching company and mailbox type
    let matchedCompanyId: string | null = null;
    let mailboxType: string = "general";

    for (const config of configData || []) {
      if (config.billing_email === toEmail) {
        matchedCompanyId = config.company_id;
        mailboxType = "billing";
        break;
      }
      if (config.notifications_email === toEmail) {
        matchedCompanyId = config.company_id;
        mailboxType = "notifications";
        break;
      }
      if (config.support_email === toEmail) {
        matchedCompanyId = config.company_id;
        mailboxType = "support";
        break;
      }
      if (config.marketing_email === toEmail) {
        matchedCompanyId = config.company_id;
        mailboxType = "marketing";
        break;
      }
      if (config.general_email === toEmail) {
        matchedCompanyId = config.company_id;
        mailboxType = "general";
        break;
      }
    }

    if (!matchedCompanyId) {
      console.log("No matching company found for email:", toEmail);
      return new Response(JSON.stringify({ success: false, message: "No matching company" }), {
        status: 200, // Return 200 to prevent SendGrid retries
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse attachments
    const attachmentInfo = formData.get("attachment-info");
    const attachments: any[] = [];
    
    if (attachmentInfo) {
      try {
        const attachmentData = JSON.parse(attachmentInfo as string);
        for (const [key, info] of Object.entries(attachmentData)) {
          const attachmentFile = formData.get(key);
          // In production, upload to storage bucket
          attachments.push({
            filename: (info as any).filename,
            content_type: (info as any)["content-type"],
            size: (info as any).size || 0,
            storage_path: null, // Would be set after uploading to storage
          });
        }
      } catch (e) {
        console.error("Error parsing attachments:", e);
      }
    }

    // Parse headers
    let rawHeaders: any = null;
    try {
      if (headers) {
        const headerLines = headers.split("\n");
        rawHeaders = {};
        for (const line of headerLines) {
          const colonIndex = line.indexOf(":");
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            rawHeaders[key] = value;
          }
        }
      }
    } catch (e) {
      console.error("Error parsing headers:", e);
    }

    // Insert the email into the database
    const emailData: InboundEmailData = {
      company_id: matchedCompanyId,
      mailbox_type: mailboxType,
      from_email: fromEmail,
      from_name: fromName,
      to_email: toEmail,
      subject: subject || null,
      body_text: text || null,
      body_html: html || null,
      attachments: attachments,
      raw_headers: rawHeaders,
      sendgrid_event_id: rawHeaders?.["Message-ID"] || null,
    };

    const { data: insertedEmail, error: insertError } = await supabase
      .from("company_inbound_emails")
      .insert(emailData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting email:", insertError);
      throw insertError;
    }

    console.log("Email stored successfully:", insertedEmail.id);

    // Check if agent processing is enabled for this mailbox
    const { data: mailboxConfig } = await supabase
      .from("company_inbound_email_config")
      .select(`${mailboxType}_agent_processing`)
      .eq("company_id", matchedCompanyId)
      .single();

    const agentProcessingEnabled = mailboxConfig?.[`${mailboxType}_agent_processing`];

    if (agentProcessingEnabled) {
      // TODO: Trigger agent processing
      // This could invoke another edge function or add to a processing queue
      console.log("Agent processing enabled for mailbox:", mailboxType);
      
      // Update email status to processing
      await supabase
        .from("company_inbound_emails")
        .update({ processing_status: "processing" })
        .eq("id", insertedEmail.id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: insertedEmail.id,
      mailbox_type: mailboxType,
      agent_processing: agentProcessingEnabled 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error processing inbound email:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
