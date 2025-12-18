-- Create company email configuration table
CREATE TABLE public.company_email_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- SMTP Server Configuration
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT,
  smtp_password TEXT,
  smtp_secure BOOLEAN DEFAULT true,
  -- Sender Configuration
  from_email TEXT,
  from_name TEXT,
  is_active BOOLEAN DEFAULT false,
  -- Company Mailboxes
  billing_email TEXT,
  notifications_email TEXT,
  support_email TEXT,
  marketing_email TEXT,
  general_email TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure one config per company
  CONSTRAINT unique_company_email_config UNIQUE (company_id)
);

-- Enable RLS
ALTER TABLE public.company_email_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company email config"
ON public.company_email_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_email_config.company_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can insert email config"
ON public.company_email_config
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_email_config.company_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company admins can update email config"
ON public.company_email_config
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_email_config.company_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company admins can delete email config"
ON public.company_email_config
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_email_config.company_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_company_email_config_updated_at
BEFORE UPDATE ON public.company_email_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_trigger();

-- Add comment
COMMENT ON TABLE public.company_email_config IS 'Company-specific email server configuration and mailboxes';