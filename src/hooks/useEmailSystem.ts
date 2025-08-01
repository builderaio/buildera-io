import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EmailConfiguration {
  id: string;
  name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  from_email: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  template_type: string;
  variables: string[];
  attachments: any[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailSendHistory {
  id: string;
  template_id?: string;
  configuration_id?: string;
  to_email: string;
  to_name?: string;
  cc_emails?: string[];
  bcc_emails?: string[];
  subject: string;
  html_content: string;
  text_content?: string;
  attachments: any[];
  variables: Record<string, string>;
  status: 'pending' | 'sent' | 'failed' | 'retry';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface SendEmailRequest {
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
    content: string;
    contentType?: string;
  }>;
}

export const useEmailSystem = () => {
  const [loading, setLoading] = useState(false);

  // Email Configurations
  const getEmailConfigurations = async () => {
    const { data, error } = await supabase
      .from("email_configurations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as EmailConfiguration[];
  };

  const createEmailConfiguration = async (config: Omit<EmailConfiguration, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from("email_configurations")
      .insert(config)
      .select()
      .single();

    if (error) throw error;
    return data as EmailConfiguration;
  };

  const updateEmailConfiguration = async (id: string, config: Partial<EmailConfiguration>) => {
    const { data, error } = await supabase
      .from("email_configurations")
      .update(config)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as EmailConfiguration;
  };

  const deleteEmailConfiguration = async (id: string) => {
    const { error } = await supabase
      .from("email_configurations")
      .delete()
      .eq("id", id);

    if (error) throw error;
  };

  const testEmailConfiguration = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-buildera-email", {
        body: {
          configurationId: id,
          to: "test@buildera.io",
          subject: "Test de Configuración - Buildera",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">¡Configuración SMTP exitosa!</h2>
              <p>Este es un email de prueba para verificar que la configuración SMTP está funcionando correctamente.</p>
              <p>Si recibiste este correo, significa que tu servidor de email está configurado correctamente en Buildera.</p>
              <br>
              <p style="color: #64748b; font-size: 14px;">
                Enviado desde {{buildera_name}} - {{buildera_website}}
              </p>
            </div>
          `,
          variables: {
            test_date: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Email Templates
  const getEmailTemplates = async () => {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as EmailTemplate[];
  };

  const createEmailTemplate = async (template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from("email_templates")
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  };

  const updateEmailTemplate = async (id: string, template: Partial<EmailTemplate>) => {
    const { data, error } = await supabase
      .from("email_templates")
      .update(template)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  };

  const deleteEmailTemplate = async (id: string) => {
    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;
  };

  // Email History
  const getEmailHistory = async (limit = 50) => {
    const { data, error } = await supabase
      .from("email_send_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as EmailSendHistory[];
  };

  // Send Email
  const sendEmail = async (emailData: SendEmailRequest) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-buildera-email", {
        body: emailData,
      });

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Utility function to extract variables from content
  const extractVariables = (content: string): string[] => {
    const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  };

  return {
    loading,
    // Configurations
    getEmailConfigurations,
    createEmailConfiguration,
    updateEmailConfiguration,
    deleteEmailConfiguration,
    testEmailConfiguration,
    // Templates
    getEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    // History
    getEmailHistory,
    // Send
    sendEmail,
    // Utils
    extractVariables,
  };
};