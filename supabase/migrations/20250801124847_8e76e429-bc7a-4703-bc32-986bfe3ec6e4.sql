-- Create email configuration table for SMTP settings
CREATE TABLE public.email_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL,
  smtp_password TEXT NOT NULL,
  smtp_secure BOOLEAN NOT NULL DEFAULT true,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  template_type TEXT NOT NULL, -- 'registration', 'password_reset', 'forgot_password', 'periodic_report', 'custom'
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names that can be used in the template
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of default attachments
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email send history table
CREATE TABLE public.email_send_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.email_templates(id),
  configuration_id UUID REFERENCES public.email_configurations(id),
  to_email TEXT NOT NULL,
  to_name TEXT,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  variables JSONB DEFAULT '{}'::jsonb, -- The actual variable values used
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'retry'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email attachments storage table
CREATE TABLE public.email_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only access)
CREATE POLICY "Admin can manage email configurations" ON public.email_configurations FOR ALL USING (true);
CREATE POLICY "Admin can manage email templates" ON public.email_templates FOR ALL USING (true);
CREATE POLICY "Admin can view email history" ON public.email_send_history FOR ALL USING (true);
CREATE POLICY "Admin can manage email attachments" ON public.email_attachments FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX idx_email_send_history_status ON public.email_send_history(status);
CREATE INDEX idx_email_send_history_created_at ON public.email_send_history(created_at);
CREATE INDEX idx_email_configurations_active ON public.email_configurations(is_active);
CREATE INDEX idx_email_configurations_default ON public.email_configurations(is_default);

-- Create function to ensure only one default configuration
CREATE OR REPLACE FUNCTION ensure_single_default_email_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.email_configurations 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default configuration
CREATE TRIGGER trigger_ensure_single_default_email_config
  BEFORE INSERT OR UPDATE ON public.email_configurations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_email_config();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_email_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_email_configurations_updated_at
  BEFORE UPDATE ON public.email_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at_column();