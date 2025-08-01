import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  templateId?: string;
  configurationId?: string;
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
  id: string;
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
  // Create SMTP connection using native Deno SMTP
  const smtp = await Deno.connect({
    hostname: config.smtp_host,
    port: config.smtp_port,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  try {
    // Read initial response
    const buffer = new Uint8Array(1024);
    await smtp.read(buffer);
    
    // EHLO command
    await smtp.write(encoder.encode(`EHLO ${config.smtp_host}\r\n`));
    await smtp.read(buffer);

    // STARTTLS if secure
    if (config.smtp_secure && config.smtp_port !== 465) {
      await smtp.write(encoder.encode("STARTTLS\r\n"));
      await smtp.read(buffer);
      // Note: In production, you'd upgrade to TLS here
    }

    // AUTH LOGIN
    await smtp.write(encoder.encode("AUTH LOGIN\r\n"));
    await smtp.read(buffer);
    
    // Send username (base64)
    const username = btoa(config.smtp_user);
    await smtp.write(encoder.encode(`${username}\r\n`));
    await smtp.read(buffer);
    
    // Send password (base64)
    const password = btoa(config.smtp_password);
    await smtp.write(encoder.encode(`${password}\r\n`));
    await smtp.read(buffer);

    // MAIL FROM
    await smtp.write(encoder.encode(`MAIL FROM:<${config.from_email}>\r\n`));
    await smtp.read(buffer);

    // RCPT TO
    await smtp.write(encoder.encode(`RCPT TO:<${emailData.to}>\r\n`));
    await smtp.read(buffer);

    // Add CC recipients
    if (emailData.cc) {
      for (const ccEmail of emailData.cc) {
        await smtp.write(encoder.encode(`RCPT TO:<${ccEmail}>\r\n`));
        await smtp.read(buffer);
      }
    }

    // Add BCC recipients
    if (emailData.bcc) {
      for (const bccEmail of emailData.bcc) {
        await smtp.write(encoder.encode(`RCPT TO:<${bccEmail}>\r\n`));
        await smtp.read(buffer);
      }
    }

    // DATA command
    await smtp.write(encoder.encode("DATA\r\n"));
    await smtp.read(buffer);

    // Build email headers and content
    let emailContent = `From: ${config.from_name} <${config.from_email}>\r\n`;
    emailContent += `To: ${emailData.toName ? `${emailData.toName} <${emailData.to}>` : emailData.to}\r\n`;
    
    if (emailData.cc && emailData.cc.length > 0) {
      emailContent += `Cc: ${emailData.cc.join(", ")}\r\n`;
    }
    
    emailContent += `Subject: ${emailData.subject}\r\n`;
    emailContent += `Date: ${new Date().toUTCString()}\r\n`;
    emailContent += `Message-ID: <${Date.now()}-${Math.random().toString(36)}@buildera.io>\r\n`;
    emailContent += `MIME-Version: 1.0\r\n`;

    if (emailData.attachments && emailData.attachments.length > 0) {
      // Multipart email with attachments
      const boundary = `boundary_${Date.now()}_${Math.random().toString(36)}`;
      emailContent += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      
      // Email body
      emailContent += `--${boundary}\r\n`;
      emailContent += `Content-Type: multipart/alternative; boundary="alt_${boundary}"\r\n\r\n`;
      
      // Text part
      if (emailData.textContent) {
        emailContent += `--alt_${boundary}\r\n`;
        emailContent += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
        emailContent += `${emailData.textContent}\r\n\r\n`;
      }
      
      // HTML part
      emailContent += `--alt_${boundary}\r\n`;
      emailContent += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
      emailContent += `${emailData.htmlContent}\r\n\r\n`;
      emailContent += `--alt_${boundary}--\r\n\r\n`;
      
      // Attachments
      for (const attachment of emailData.attachments) {
        emailContent += `--${boundary}\r\n`;
        emailContent += `Content-Type: ${attachment.contentType || "application/octet-stream"}\r\n`;
        emailContent += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        emailContent += `Content-Transfer-Encoding: base64\r\n\r\n`;
        emailContent += `${attachment.content}\r\n\r\n`;
      }
      
      emailContent += `--${boundary}--\r\n`;
    } else {
      // Simple email without attachments
      if (emailData.textContent && emailData.htmlContent) {
        const boundary = `boundary_${Date.now()}_${Math.random().toString(36)}`;
        emailContent += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
        
        emailContent += `--${boundary}\r\n`;
        emailContent += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
        emailContent += `${emailData.textContent}\r\n\r\n`;
        
        emailContent += `--${boundary}\r\n`;
        emailContent += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
        emailContent += `${emailData.htmlContent}\r\n\r\n`;
        
        emailContent += `--${boundary}--\r\n`;
      } else {
        emailContent += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
        emailContent += `${emailData.htmlContent}\r\n`;
      }
    }

    emailContent += "\r\n.\r\n";

    // Send email content
    await smtp.write(encoder.encode(emailContent));
    await smtp.read(buffer);

    // QUIT
    await smtp.write(encoder.encode("QUIT\r\n"));
    await smtp.read(buffer);

    return { success: true };
  } catch (error) {
    throw new Error(`SMTP Error: ${error.message}`);
  } finally {
    smtp.close();
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

  try {
    const requestData: SendEmailRequest = await req.json();

    let emailConfig: EmailConfiguration;
    let template: EmailTemplate | null = null;

    // Get email configuration
    if (requestData.configurationId) {
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

    // Save to history
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

    // Save failed attempt to history if we have enough data
    try {
      const requestData: SendEmailRequest = await req.json();
      if (requestData.to) {
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
      }
    } catch {
      // Ignore errors when saving failed attempts
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