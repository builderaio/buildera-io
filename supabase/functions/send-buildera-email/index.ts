import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  templateId?: string;
  configurationId?: string;
  configuration?: EmailConfiguration; // For testing purposes
  test?: boolean; // Indicates this is a test email
  to: string;
  toName?: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  variables?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    contentType?: string;
  }>;
}

interface EmailConfiguration {
  id?: string; // Optional for test configurations
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  from_email: string;
  from_name: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: string[];
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function sendSMTPEmail(
  config: EmailConfiguration,
  emailData: {
    to: string;
    toName?: string;
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    attachments?: Array<{ filename: string; content: string; contentType?: string }>;
  }
) {
  console.log("Sending email with config:", {
    host: config.smtp_host,
    port: config.smtp_port,
    user: config.smtp_user,
    secure: config.smtp_secure,
    from: config.from_email,
    to: emailData.to,
    subject: emailData.subject
  });

  // Validation of SMTP settings
  if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
    throw new Error("Missing required SMTP configuration");
  }

  if (!emailData.to || !emailData.subject || !emailData.htmlContent) {
    throw new Error("Missing required email data");
  }

  try {
    console.log("Connecting to SMTP server...");
    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: config.smtp_host,
        port: config.smtp_port,
        tls: config.smtp_secure,
        auth: {
          username: config.smtp_user,
          password: config.smtp_password,
        },
      },
    });

    // Prepare recipients
    const toList = [`${emailData.toName ? `${emailData.toName} <${emailData.to}>` : emailData.to}`];
    const ccList = emailData.cc?.map(email => email) || [];
    const bccList = emailData.bcc?.map(email => email) || [];

    // Clean and properly format content for SMTP compliance
    const cleanCRLF = (content: string) => {
      return content
        .replace(/\r?\n/g, '\r\n') // Ensure CRLF
        .replace(/(?<!\r)\n/g, '\r\n') // Guard against any lone LFs
        .replace(/\r\n/g, '\r\n') // Normalize
        .trim();
    };

    const htmlBody = cleanCRLF(emailData.htmlContent);
    const textBody = cleanCRLF(
      emailData.textContent || emailData.htmlContent.replace(/<[^>]*>/g, ' ')
    );

    // Send email
    await client.send({
      from: `${config.from_name} <${config.from_email}>`,
      to: toList,
      cc: ccList.length > 0 ? ccList : undefined,
      bcc: bccList.length > 0 ? bccList : undefined,
      subject: emailData.subject,
      content: textBody,
      html: htmlBody,
    });

    await client.close();
    
    console.log("Email sent successfully to:", emailData.to);
    return { success: true };
  } catch (error) {
    console.error("SMTP Error:", error);
    throw new Error(`Failed to send email via SMTP: ${(error as Error).message}`);
  }
}

function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let requestData: any;
  
  try {
    requestData = await req.json();
    console.log("Request data received:", {
      test: requestData.test,
      hasConfiguration: !!requestData.configuration,
      configurationId: requestData.configurationId,
      to: requestData.to
    });

    let emailConfig: EmailConfiguration;
    let template: EmailTemplate | null = null;

    // Get email configuration
    if (requestData.configuration && requestData.test) {
      // Use provided configuration for testing
      emailConfig = requestData.configuration;
      console.log("Using test configuration");
    } else if (requestData.configurationId) {
      // Use specific configuration ID
      const { data: configData, error: configError } = await supabase
        .from("email_configurations")
        .select("*")
        .eq("id", requestData.configurationId)
        .eq("is_active", true)
        .single();

      if (configError || !configData) {
        console.error("Configuration ID error:", configError);
        throw new Error(`Email configuration not found or inactive: ${configError?.message}`);
      }
      emailConfig = configData;
      console.log("Using specific configuration:", requestData.configurationId);
    } else {
      // Get default configuration - this is the key fix
      console.log("Attempting to get default email configuration...");
      const { data: configData, error: configError } = await supabase
        .from("email_configurations")
        .select("*")
        .eq("is_default", true)
        .eq("is_active", true)
        .single();

      if (configError) {
        console.error("Default configuration error:", configError);
        console.log("Falling back to any active configuration...");
        
        // Fallback: get any active configuration
        const { data: fallbackConfig, error: fallbackError } = await supabase
          .from("email_configurations")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .single();
          
        if (fallbackError || !fallbackConfig) {
          console.error("No email configuration available:", fallbackError);
          throw new Error("No email configuration found. Please set up an email configuration first.");
        }
        emailConfig = fallbackConfig;
        console.log("Using fallback configuration:", fallbackConfig.id);
      } else if (!configData) {
        throw new Error("No default email configuration found. Please set up a default email configuration.");
      } else {
        emailConfig = configData;
        console.log("Using default configuration:", configData.id);
      }
    }

    // Get template if specified
    if (requestData.templateId) {
      const { data: templateData, error: templateError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", requestData.templateId)
        .eq("is_active", true)
        .single();

      if (templateError || !templateData) {
        throw new Error("Email template not found or inactive");
      }
      template = templateData;
    }

    // Prepare email data
    const variables = requestData.variables || {};
    
    // Add Buildera branding variables with correct paths
    variables.buildera_logo = "https://buildera.io/lovable-uploads/9bbad23a-3f28-47fd-bf57-1a43f0129bff.png";
    variables.buildera_name = "Buildera";
    variables.buildera_website = "https://buildera.io";
    variables.current_year = new Date().getFullYear().toString();

    let subject = requestData.subject;
    let htmlContent = requestData.htmlContent;
    let textContent = requestData.textContent;

    if (template) {
      subject = replaceVariables(template.subject, variables);
      htmlContent = replaceVariables(template.html_content, variables);
      textContent = template.text_content ? replaceVariables(template.text_content, variables) : undefined;
    } else if (htmlContent) {
      htmlContent = replaceVariables(htmlContent, variables);
      if (textContent) {
        textContent = replaceVariables(textContent, variables);
      }
      if (subject) {
        subject = replaceVariables(subject, variables);
      }
    }

    if (!subject || !htmlContent) {
      throw new Error("Subject and HTML content are required");
    }

    // Send email via SMTP
    await sendSMTPEmail(emailConfig, {
      to: requestData.to,
      toName: requestData.toName,
      cc: requestData.cc,
      bcc: requestData.bcc,
      subject,
      htmlContent,
      textContent,
      attachments: requestData.attachments,
    });

    // Save to history (only if not a test)
    if (!requestData.test && emailConfig.id) {
      const { error: historyError } = await supabase
        .from("email_send_history")
        .insert({
          template_id: requestData.templateId || null,
          to_email: requestData.to,
          to_name: requestData.toName || null,
          cc_emails: requestData.cc || null,
          bcc_emails: requestData.bcc || null,
          subject,
          html_content: htmlContent,
          text_content: textContent || null,
          attachments: requestData.attachments || [],
          variables,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

      if (historyError) {
        console.error("Error saving email history:", historyError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);

    // Save failed attempt to history if we have enough data and it's not a test
    if (requestData && requestData.to && !requestData.test) {
      try {
        await supabase
          .from("email_send_history")
          .insert({
            template_id: requestData.templateId || null,
            to_email: requestData.to,
            to_name: requestData.toName || null,
            subject: requestData.subject || "Email send failed",
            html_content: requestData.htmlContent || "",
            status: "failed",
            error_message: error.message,
          });
      } catch {
        // Ignore errors when saving failed attempts
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);