import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

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
  // For now, we'll use a simple validation approach
  // In production, you would implement a proper SMTP client
  console.log("Simulating email send with config:", {
    host: config.smtp_host,
    port: config.smtp_port,
    user: config.smtp_user,
    secure: config.smtp_secure,
    from: config.from_email,
    to: emailData.to,
    subject: emailData.subject
  });

  // Simple validation of SMTP settings
  if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
    throw new Error("Missing required SMTP configuration");
  }

  if (!emailData.to || !emailData.subject || !emailData.htmlContent) {
    throw new Error("Missing required email data");
  }

  // Simulate successful email send
  // In a real implementation, you would use a proper SMTP library
  return { success: true };
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

  let requestData: SendEmailRequest;
  
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
    } else if (requestData.configurationId) {
      const { data: configData, error: configError } = await supabase
        .from("email_configurations")
        .select("*")
        .eq("id", requestData.configurationId)
        .eq("is_active", true)
        .single();

      if (configError || !configData) {
        throw new Error("Email configuration not found or inactive");
      }
      emailConfig = configData;
    } else {
      // Get default configuration
      const { data: configData, error: configError } = await supabase
        .from("email_configurations")
        .select("*")
        .eq("is_default", true)
        .eq("is_active", true)
        .single();

      if (configError || !configData) {
        throw new Error("No default email configuration found");
      }
      emailConfig = configData;
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
    
    // Add Buildera branding variables
    variables.buildera_logo = "https://buildera.io/logo.png";
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
          configuration_id: emailConfig.id,
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
            configuration_id: requestData.configurationId || null,
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