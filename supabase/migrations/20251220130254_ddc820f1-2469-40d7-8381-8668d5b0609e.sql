-- =============================================
-- CRM COMPLETO PARA BUILDERA - B2C/B2B
-- =============================================

-- 1. TABLA DE PIPELINES (debe crearse primero para FK)
CREATE TABLE public.crm_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pipeline_type TEXT NOT NULL DEFAULT 'sales' CHECK (pipeline_type IN ('sales', 'support', 'onboarding', 'renewal', 'custom')),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  default_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ETAPAS DEL PIPELINE
CREATE TABLE public.crm_pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  position INTEGER NOT NULL DEFAULT 0,
  stage_type TEXT NOT NULL DEFAULT 'open' CHECK (stage_type IN ('open', 'won', 'lost')),
  default_probability NUMERIC DEFAULT 0 CHECK (default_probability >= 0 AND default_probability <= 100),
  auto_actions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CUENTAS B2B (empresas clientes)
CREATE TABLE public.crm_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  employee_count INTEGER,
  website TEXT,
  linkedin_url TEXT,
  account_type TEXT DEFAULT 'prospect' CHECK (account_type IN ('prospect', 'customer', 'partner', 'churned')),
  account_tier TEXT DEFAULT 'smb' CHECK (account_tier IN ('enterprise', 'mid_market', 'smb', 'startup')),
  country TEXT,
  city TEXT,
  address TEXT,
  timezone TEXT,
  annual_revenue NUMERIC,
  lifetime_value NUMERIC DEFAULT 0,
  billing_currency TEXT DEFAULT 'USD',
  primary_contact_id UUID,
  owner_user_id UUID,
  ai_enrichment JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CONTACTOS (unificado B2C/B2B)
CREATE TABLE public.crm_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  business_type TEXT NOT NULL DEFAULT 'b2c' CHECK (business_type IN ('b2c', 'b2b')),
  contact_type TEXT DEFAULT 'lead' CHECK (contact_type IN ('lead', 'customer', 'churned', 'prospect')),
  lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN ('subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist')),
  -- Datos personales
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  -- Datos profesionales (B2B)
  job_title TEXT,
  department TEXT,
  linkedin_url TEXT,
  -- Datos demográficos (B2C)
  birthdate DATE,
  gender TEXT,
  location TEXT,
  city TEXT,
  country TEXT,
  -- Origen
  source TEXT DEFAULT 'manual' CHECK (source IN ('inbound_email', 'web_form', 'social_media', 'referral', 'import', 'manual', 'ai_enriched')),
  source_details JSONB DEFAULT '{}',
  -- Métricas
  lifetime_value NUMERIC DEFAULT 0,
  acquisition_cost NUMERIC DEFAULT 0,
  engagement_score NUMERIC DEFAULT 0,
  -- IA
  ai_enrichment JSONB DEFAULT '{}',
  ai_tags TEXT[] DEFAULT '{}',
  ai_next_best_action TEXT,
  last_ai_analysis TIMESTAMPTZ,
  -- Configuración
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_subscribed_email BOOLEAN DEFAULT true,
  is_subscribed_sms BOOLEAN DEFAULT false,
  owner_user_id UUID,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agregar FK de primary_contact_id después de crear crm_contacts
ALTER TABLE public.crm_accounts 
ADD CONSTRAINT crm_accounts_primary_contact_id_fkey 
FOREIGN KEY (primary_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- 5. DEALS/OPORTUNIDADES
CREATE TABLE public.crm_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.crm_pipeline_stages(id) ON DELETE CASCADE,
  deal_name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  expected_close_date DATE,
  actual_close_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  probability NUMERIC DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  weighted_amount NUMERIC GENERATED ALWAYS AS (amount * probability / 100) STORED,
  loss_reason TEXT,
  products JSONB DEFAULT '[]',
  owner_user_id UUID,
  ai_predictions JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ACTIVIDADES/HISTORIAL
CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('email_sent', 'email_received', 'call', 'meeting', 'note', 'task', 'status_change', 'ai_insight', 'deal_created', 'deal_won', 'deal_lost', 'stage_change')),
  subject TEXT,
  description TEXT,
  activity_date TIMESTAMPTZ DEFAULT now(),
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_by_user_id UUID,
  ai_generated BOOLEAN DEFAULT false,
  related_email_id UUID REFERENCES public.company_inbound_emails(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TAGS
CREATE TABLE public.crm_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  tag_type TEXT NOT NULL CHECK (tag_type IN ('contact', 'account', 'deal', 'all')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name, tag_type)
);

-- 8. CAMPOS PERSONALIZADOS
CREATE TABLE public.crm_custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect', 'boolean', 'url', 'email', 'phone')),
  options JSONB DEFAULT '[]',
  applies_to TEXT NOT NULL CHECK (applies_to IN ('contact', 'account', 'deal')),
  is_required BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, field_name, applies_to)
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_crm_contacts_company_id ON public.crm_contacts(company_id);
CREATE INDEX idx_crm_contacts_email ON public.crm_contacts(company_id, email);
CREATE INDEX idx_crm_contacts_account_id ON public.crm_contacts(account_id);
CREATE INDEX idx_crm_contacts_lifecycle ON public.crm_contacts(company_id, lifecycle_stage);
CREATE INDEX idx_crm_contacts_type ON public.crm_contacts(company_id, business_type, contact_type);
CREATE INDEX idx_crm_contacts_last_activity ON public.crm_contacts(company_id, last_activity_at DESC);

CREATE INDEX idx_crm_accounts_company_id ON public.crm_accounts(company_id);
CREATE INDEX idx_crm_accounts_type ON public.crm_accounts(company_id, account_type);

CREATE INDEX idx_crm_deals_company_id ON public.crm_deals(company_id);
CREATE INDEX idx_crm_deals_pipeline ON public.crm_deals(pipeline_id, stage_id);
CREATE INDEX idx_crm_deals_status ON public.crm_deals(company_id, status);
CREATE INDEX idx_crm_deals_contact ON public.crm_deals(contact_id);

CREATE INDEX idx_crm_activities_company_id ON public.crm_activities(company_id);
CREATE INDEX idx_crm_activities_contact ON public.crm_activities(contact_id, activity_date DESC);
CREATE INDEX idx_crm_activities_deal ON public.crm_activities(deal_id, activity_date DESC);
CREATE INDEX idx_crm_activities_type ON public.crm_activities(company_id, activity_type);

CREATE INDEX idx_crm_pipelines_company ON public.crm_pipelines(company_id);
CREATE INDEX idx_crm_pipeline_stages_pipeline ON public.crm_pipeline_stages(pipeline_id, position);

CREATE INDEX idx_crm_tags_company ON public.crm_tags(company_id, tag_type);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_custom_fields ENABLE ROW LEVEL SECURITY;

-- Policies para crm_pipelines
CREATE POLICY "Company members can view pipelines" ON public.crm_pipelines
  FOR SELECT USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Company admins can manage pipelines" ON public.crm_pipelines
  FOR ALL USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')));

CREATE POLICY "Service role can access pipelines" ON public.crm_pipelines
  FOR SELECT USING (true);

-- Policies para crm_pipeline_stages
CREATE POLICY "Company members can view stages" ON public.crm_pipeline_stages
  FOR SELECT USING (pipeline_id IN (SELECT id FROM crm_pipelines WHERE company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid())));

CREATE POLICY "Company admins can manage stages" ON public.crm_pipeline_stages
  FOR ALL USING (pipeline_id IN (SELECT id FROM crm_pipelines WHERE company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin'))));

CREATE POLICY "Service role can access stages" ON public.crm_pipeline_stages
  FOR SELECT USING (true);

-- Policies para crm_accounts
CREATE POLICY "Company members can view accounts" ON public.crm_accounts
  FOR SELECT USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Company members can manage accounts" ON public.crm_accounts
  FOR ALL USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Service role can access accounts" ON public.crm_accounts
  FOR ALL USING (true);

-- Policies para crm_contacts
CREATE POLICY "Company members can view contacts" ON public.crm_contacts
  FOR SELECT USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Company members can manage contacts" ON public.crm_contacts
  FOR ALL USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Service role can access contacts" ON public.crm_contacts
  FOR ALL USING (true);

-- Policies para crm_deals
CREATE POLICY "Company members can view deals" ON public.crm_deals
  FOR SELECT USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Company members can manage deals" ON public.crm_deals
  FOR ALL USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Service role can access deals" ON public.crm_deals
  FOR ALL USING (true);

-- Policies para crm_activities
CREATE POLICY "Company members can view activities" ON public.crm_activities
  FOR SELECT USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Company members can manage activities" ON public.crm_activities
  FOR ALL USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Service role can access activities" ON public.crm_activities
  FOR ALL USING (true);

-- Policies para crm_tags
CREATE POLICY "Company members can view tags" ON public.crm_tags
  FOR SELECT USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Company admins can manage tags" ON public.crm_tags
  FOR ALL USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')));

CREATE POLICY "Service role can access tags" ON public.crm_tags
  FOR ALL USING (true);

-- Policies para crm_custom_fields
CREATE POLICY "Company members can view custom fields" ON public.crm_custom_fields
  FOR SELECT USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Company admins can manage custom fields" ON public.crm_custom_fields
  FOR ALL USING (company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')));

CREATE POLICY "Service role can access custom fields" ON public.crm_custom_fields
  FOR ALL USING (true);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================
CREATE TRIGGER update_crm_pipelines_updated_at
  BEFORE UPDATE ON public.crm_pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_pipeline_stages_updated_at
  BEFORE UPDATE ON public.crm_pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_accounts_updated_at
  BEFORE UPDATE ON public.crm_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON public.crm_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_custom_fields_updated_at
  BEFORE UPDATE ON public.crm_custom_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNCIÓN PARA ACTUALIZAR LAST_ACTIVITY_AT EN CONTACTS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_contact_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE public.crm_contacts 
    SET last_activity_at = NEW.activity_date 
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_contact_last_activity
  AFTER INSERT ON public.crm_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_last_activity();