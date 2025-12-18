-- Table for inbound email configuration per company
CREATE TABLE public.company_inbound_email_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Inbound mailbox configurations
  billing_email TEXT,
  billing_forwarding_enabled BOOLEAN DEFAULT false,
  billing_agent_processing BOOLEAN DEFAULT false,
  
  notifications_email TEXT,
  notifications_forwarding_enabled BOOLEAN DEFAULT false,
  notifications_agent_processing BOOLEAN DEFAULT false,
  
  support_email TEXT,
  support_forwarding_enabled BOOLEAN DEFAULT false,
  support_agent_processing BOOLEAN DEFAULT false,
  
  marketing_email TEXT,
  marketing_forwarding_enabled BOOLEAN DEFAULT false,
  marketing_agent_processing BOOLEAN DEFAULT false,
  
  general_email TEXT,
  general_forwarding_enabled BOOLEAN DEFAULT false,
  general_agent_processing BOOLEAN DEFAULT false,
  
  -- SendGrid Inbound Parse configuration (for future)
  sendgrid_inbound_enabled BOOLEAN DEFAULT false,
  sendgrid_parse_domain TEXT,
  sendgrid_webhook_secret TEXT,
  
  -- Global settings
  is_active BOOLEAN DEFAULT false,
  auto_categorize BOOLEAN DEFAULT true,
  retention_days INTEGER DEFAULT 90,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT company_inbound_email_config_company_unique UNIQUE (company_id)
);

-- Table to store received inbound emails
CREATE TABLE public.company_inbound_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Email metadata
  mailbox_type TEXT NOT NULL, -- billing, notifications, support, marketing, general
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  subject TEXT,
  
  -- Email content
  body_text TEXT,
  body_html TEXT,
  
  -- Attachments stored as JSONB array [{filename, content_type, size, storage_path}]
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Processing metadata
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_status TEXT DEFAULT 'pending', -- pending, processing, processed, failed, archived
  
  -- Agent processing results
  agent_id UUID REFERENCES public.platform_agents(id),
  agent_analysis JSONB,
  agent_actions_taken JSONB DEFAULT '[]'::jsonb,
  
  -- Categorization
  category TEXT, -- invoice, receipt, inquiry, complaint, newsletter, etc.
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  tags TEXT[] DEFAULT '{}',
  
  -- User interaction
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Raw email data for debugging
  raw_headers JSONB,
  sendgrid_event_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_inbound_email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_inbound_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inbound email config
CREATE POLICY "Company members can view inbound email config"
ON public.company_inbound_email_config
FOR SELECT
USING (company_id IN (
  SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()
));

CREATE POLICY "Company admins can manage inbound email config"
ON public.company_inbound_email_config
FOR ALL
USING (company_id IN (
  SELECT cm.company_id FROM company_members cm 
  WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
))
WITH CHECK (company_id IN (
  SELECT cm.company_id FROM company_members cm 
  WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
));

-- RLS Policies for inbound emails
CREATE POLICY "Company members can view inbound emails"
ON public.company_inbound_emails
FOR SELECT
USING (company_id IN (
  SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()
));

CREATE POLICY "Company admins can manage inbound emails"
ON public.company_inbound_emails
FOR ALL
USING (company_id IN (
  SELECT cm.company_id FROM company_members cm 
  WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
))
WITH CHECK (company_id IN (
  SELECT cm.company_id FROM company_members cm 
  WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
));

-- Service role policy for webhook processing
CREATE POLICY "Service role can insert inbound emails"
ON public.company_inbound_emails
FOR INSERT
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_company_inbound_emails_company ON public.company_inbound_emails(company_id);
CREATE INDEX idx_company_inbound_emails_mailbox ON public.company_inbound_emails(mailbox_type);
CREATE INDEX idx_company_inbound_emails_status ON public.company_inbound_emails(processing_status);
CREATE INDEX idx_company_inbound_emails_received ON public.company_inbound_emails(received_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_company_inbound_email_config_updated_at
BEFORE UPDATE ON public.company_inbound_email_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_inbound_emails_updated_at
BEFORE UPDATE ON public.company_inbound_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();