-- Create AI Agent Builder WhiteLabel Portal Database Structure

-- Developer profiles and authentication
CREATE TABLE public.developer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  developer_name TEXT NOT NULL,
  company_name TEXT,
  website_url TEXT,
  bio TEXT,
  avatar_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  specialties TEXT[],
  verified BOOLEAN DEFAULT false,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  total_agents_created INTEGER DEFAULT 0,
  total_deployments INTEGER DEFAULT 0,
  total_revenue DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- White-label AI agent templates created by developers
CREATE TABLE public.whitelabel_agent_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id UUID NOT NULL REFERENCES public.developer_profiles(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  banner_image_url TEXT,
  flow_definition JSONB NOT NULL DEFAULT '{}',
  knowledge_base_config JSONB DEFAULT '{}',
  ai_capabilities JSONB DEFAULT '{}', -- voice, vision, text, etc.
  integration_config JSONB DEFAULT '{}', -- APIs, webhooks, CRM
  customization_options JSONB DEFAULT '{}', -- branding, domain, features
  pricing_model TEXT DEFAULT 'freemium' CHECK (pricing_model IN ('free', 'freemium', 'paid', 'enterprise')),
  base_price DECIMAL DEFAULT 0,
  revenue_share_percentage DECIMAL DEFAULT 70, -- Developer gets 70% by default
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  version TEXT DEFAULT '1.0.0',
  tags TEXT[],
  demo_url TEXT,
  documentation_url TEXT,
  total_deployments INTEGER DEFAULT 0,
  average_rating DECIMAL DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Company deployments of white-label agents
CREATE TABLE public.whitelabel_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.whitelabel_agent_templates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  deployment_name TEXT NOT NULL,
  custom_domain TEXT,
  branding_config JSONB DEFAULT '{}', -- colors, logo, styling
  agent_config JSONB DEFAULT '{}', -- customized agent settings
  integration_settings JSONB DEFAULT '{}', -- company-specific integrations
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suspended', 'terminated')),
  deployment_url TEXT,
  api_key TEXT UNIQUE,
  usage_stats JSONB DEFAULT '{}',
  billing_config JSONB DEFAULT '{}',
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_id, company_id)
);

-- Flow builder nodes and connections
CREATE TABLE public.flow_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.whitelabel_agent_templates(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL, -- unique within template
  node_type TEXT NOT NULL, -- trigger, action, condition, ai, integration
  position JSONB NOT NULL, -- x, y coordinates
  config JSONB DEFAULT '{}', -- node-specific configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_id, node_id)
);

CREATE TABLE public.flow_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.whitelabel_agent_templates(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  source_handle TEXT,
  target_handle TEXT,
  condition_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Knowledge base management
CREATE TABLE public.whitelabel_knowledge_bases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.whitelabel_agent_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('documents', 'website', 'api', 'database', 'custom')),
  source_config JSONB NOT NULL DEFAULT '{}',
  processing_config JSONB DEFAULT '{}',
  embeddings_model TEXT DEFAULT 'text-embedding-3-small',
  chunk_size INTEGER DEFAULT 1000,
  chunk_overlap INTEGER DEFAULT 200,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  total_chunks INTEGER DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics and metrics
CREATE TABLE public.whitelabel_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deployment_id UUID NOT NULL REFERENCES public.whitelabel_deployments(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- conversations, messages, users, revenue, etc.
  metric_value DECIMAL NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
);

-- Developer marketplace reviews and ratings
CREATE TABLE public.whitelabel_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.whitelabel_agent_templates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  features_rating INTEGER CHECK (features_rating >= 1 AND features_rating <= 5),
  support_rating INTEGER CHECK (support_rating >= 1 AND support_rating <= 5),
  ease_of_use_rating INTEGER CHECK (ease_of_use_rating >= 1 AND ease_of_use_rating <= 5),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_id, company_id)
);

-- Revenue sharing and billing
CREATE TABLE public.whitelabel_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id UUID NOT NULL REFERENCES public.developer_profiles(id) ON DELETE CASCADE,
  deployment_id UUID NOT NULL REFERENCES public.whitelabel_deployments(id) ON DELETE CASCADE,
  revenue_amount DECIMAL NOT NULL,
  developer_share DECIMAL NOT NULL,
  platform_share DECIMAL NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'usage', 'one_time', 'commission')),
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelabel_agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelabel_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelabel_knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelabel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelabel_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelabel_revenue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Developer Profiles
CREATE POLICY "Developers can view their own profile" 
ON public.developer_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Developers can update their own profile" 
ON public.developer_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Developers can create their own profile" 
ON public.developer_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view verified developer profiles" 
ON public.developer_profiles FOR SELECT 
USING (verified = true);

-- RLS Policies for White-label Agent Templates
CREATE POLICY "Developers can manage their own templates" 
ON public.whitelabel_agent_templates FOR ALL 
USING (developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public can view published templates" 
ON public.whitelabel_agent_templates FOR SELECT 
USING (is_published = true);

-- RLS Policies for Deployments
CREATE POLICY "Companies can view their own deployments" 
ON public.whitelabel_deployments FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

CREATE POLICY "Companies can manage their own deployments" 
ON public.whitelabel_deployments FOR ALL 
USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Developers can view deployments of their templates" 
ON public.whitelabel_deployments FOR SELECT 
USING (template_id IN (SELECT id FROM public.whitelabel_agent_templates WHERE developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid())));

-- RLS Policies for Flow Components
CREATE POLICY "Developers can manage flow components of their templates" 
ON public.flow_nodes FOR ALL 
USING (template_id IN (SELECT id FROM public.whitelabel_agent_templates WHERE developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Developers can manage flow connections of their templates" 
ON public.flow_connections FOR ALL 
USING (template_id IN (SELECT id FROM public.whitelabel_agent_templates WHERE developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid())));

-- RLS Policies for Knowledge Bases
CREATE POLICY "Developers can manage knowledge bases of their templates" 
ON public.whitelabel_knowledge_bases FOR ALL 
USING (template_id IN (SELECT id FROM public.whitelabel_agent_templates WHERE developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid())));

-- RLS Policies for Analytics
CREATE POLICY "Companies can view analytics of their deployments" 
ON public.whitelabel_analytics FOR SELECT 
USING (deployment_id IN (SELECT id FROM public.whitelabel_deployments WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));

CREATE POLICY "Developers can view analytics of their template deployments" 
ON public.whitelabel_analytics FOR SELECT 
USING (deployment_id IN (SELECT id FROM public.whitelabel_deployments WHERE template_id IN (SELECT id FROM public.whitelabel_agent_templates WHERE developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid()))));

-- RLS Policies for Reviews
CREATE POLICY "Public can view public reviews" 
ON public.whitelabel_reviews FOR SELECT 
USING (is_public = true);

CREATE POLICY "Companies can manage their own reviews" 
ON public.whitelabel_reviews FOR ALL 
USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

-- RLS Policies for Revenue
CREATE POLICY "Developers can view their own revenue" 
ON public.whitelabel_revenue FOR SELECT 
USING (developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all revenue" 
ON public.whitelabel_revenue FOR SELECT 
USING (current_user_is_admin());

-- Create indexes for performance
CREATE INDEX idx_developer_profiles_user_id ON public.developer_profiles(user_id);
CREATE INDEX idx_whitelabel_templates_developer_id ON public.whitelabel_agent_templates(developer_id);
CREATE INDEX idx_whitelabel_templates_published ON public.whitelabel_agent_templates(is_published);
CREATE INDEX idx_whitelabel_deployments_company_id ON public.whitelabel_deployments(company_id);
CREATE INDEX idx_whitelabel_deployments_template_id ON public.whitelabel_deployments(template_id);
CREATE INDEX idx_flow_nodes_template_id ON public.flow_nodes(template_id);
CREATE INDEX idx_flow_connections_template_id ON public.flow_connections(template_id);
CREATE INDEX idx_whitelabel_analytics_deployment_id ON public.whitelabel_analytics(deployment_id);
CREATE INDEX idx_whitelabel_analytics_recorded_at ON public.whitelabel_analytics(recorded_at);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_whitelabel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_developer_profiles_updated_at
  BEFORE UPDATE ON public.developer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_whitelabel_updated_at();

CREATE TRIGGER update_whitelabel_templates_updated_at
  BEFORE UPDATE ON public.whitelabel_agent_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_whitelabel_updated_at();

CREATE TRIGGER update_whitelabel_deployments_updated_at
  BEFORE UPDATE ON public.whitelabel_deployments
  FOR EACH ROW EXECUTE FUNCTION public.update_whitelabel_updated_at();