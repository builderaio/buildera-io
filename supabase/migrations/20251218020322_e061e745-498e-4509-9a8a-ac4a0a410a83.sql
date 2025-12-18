-- 1. Company Timezone & Schedule Configuration
CREATE TABLE public.company_schedule_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'America/Mexico_City',
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '18:00',
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  preferred_posting_times JSONB DEFAULT '{"instagram": ["09:00", "13:00", "19:00"], "facebook": ["10:00", "14:00", "20:00"], "linkedin": ["08:00", "12:00", "17:00"], "tiktok": ["12:00", "18:00", "21:00"], "twitter": ["09:00", "12:00", "18:00"]}'::jsonb,
  content_frequency JSONB DEFAULT '{"instagram": 5, "facebook": 3, "linkedin": 2, "tiktok": 7, "twitter": 5}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_company_schedule UNIQUE (company_id)
);

-- 2. Marketing Goals Configuration
CREATE TABLE public.company_marketing_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  primary_goal TEXT,
  secondary_goals TEXT[],
  target_audience_size INTEGER,
  monthly_lead_target INTEGER,
  monthly_conversion_target NUMERIC(5,2),
  brand_awareness_target INTEGER,
  engagement_rate_target NUMERIC(5,2),
  kpis JSONB DEFAULT '[]'::jsonb,
  campaign_budget_monthly NUMERIC(12,2),
  growth_timeline TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_company_marketing_goals UNIQUE (company_id)
);

-- 3. Company Products/Services Catalog
CREATE TABLE public.company_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price NUMERIC(12,2),
  currency TEXT DEFAULT 'MXN',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  value_proposition TEXT,
  target_audience TEXT,
  benefits TEXT[],
  keywords TEXT[],
  image_url TEXT,
  landing_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Advanced Communication Settings
CREATE TABLE public.company_communication_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  forbidden_words TEXT[],
  approved_slogans TEXT[],
  hashtag_strategy JSONB DEFAULT '{"always_use": [], "never_use": [], "campaign_specific": []}'::jsonb,
  tone_by_platform JSONB DEFAULT '{"instagram": "casual", "facebook": "friendly", "linkedin": "professional", "tiktok": "fun", "twitter": "conversational"}'::jsonb,
  emoji_usage TEXT DEFAULT 'moderate',
  language_formality TEXT DEFAULT 'semi-formal',
  call_to_action_phrases TEXT[],
  content_pillars TEXT[],
  topics_to_avoid TEXT[],
  response_templates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_company_communication UNIQUE (company_id)
);

-- 5. Competitors Tracking
CREATE TABLE public.company_competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  website_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  linkedin_url TEXT,
  tiktok_url TEXT,
  twitter_url TEXT,
  is_direct_competitor BOOLEAN DEFAULT true,
  priority_level INTEGER DEFAULT 2,
  monitor_pricing BOOLEAN DEFAULT true,
  monitor_content BOOLEAN DEFAULT true,
  monitor_campaigns BOOLEAN DEFAULT true,
  notes TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Agent Preferences per Company
CREATE TABLE public.company_agent_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  default_creativity_level NUMERIC(3,2) DEFAULT 0.7,
  default_content_length TEXT DEFAULT 'medium',
  preferred_ai_model TEXT,
  auto_approve_content BOOLEAN DEFAULT false,
  require_human_review BOOLEAN DEFAULT true,
  max_daily_executions INTEGER DEFAULT 50,
  notification_preferences JSONB DEFAULT '{"on_completion": true, "on_error": true, "daily_summary": true}'::jsonb,
  content_guidelines TEXT,
  quality_threshold NUMERIC(3,2) DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_company_agent_prefs UNIQUE (company_id)
);

-- 7. Platform-specific Settings
CREATE TABLE public.company_platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_publish BOOLEAN DEFAULT false,
  require_approval BOOLEAN DEFAULT true,
  max_posts_per_day INTEGER DEFAULT 3,
  preferred_content_types TEXT[],
  character_limit_override INTEGER,
  hashtag_limit INTEGER,
  default_visibility TEXT DEFAULT 'public',
  scheduling_enabled BOOLEAN DEFAULT true,
  analytics_tracking BOOLEAN DEFAULT true,
  custom_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_company_platform UNIQUE (company_id, platform)
);

-- Enable RLS on all tables
ALTER TABLE public.company_schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_marketing_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_communication_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_agent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_schedule_config
CREATE POLICY "Company members can view schedule config" ON public.company_schedule_config
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_schedule_config.company_id AND company_members.user_id = auth.uid()));

CREATE POLICY "Company admins can manage schedule config" ON public.company_schedule_config
  FOR ALL USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_schedule_config.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin')));

-- RLS Policies for company_marketing_goals
CREATE POLICY "Company members can view marketing goals" ON public.company_marketing_goals
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_marketing_goals.company_id AND company_members.user_id = auth.uid()));

CREATE POLICY "Company admins can manage marketing goals" ON public.company_marketing_goals
  FOR ALL USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_marketing_goals.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin')));

-- RLS Policies for company_products
CREATE POLICY "Company members can view products" ON public.company_products
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_products.company_id AND company_members.user_id = auth.uid()));

CREATE POLICY "Company admins can manage products" ON public.company_products
  FOR ALL USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_products.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin')));

-- RLS Policies for company_communication_settings
CREATE POLICY "Company members can view communication settings" ON public.company_communication_settings
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_communication_settings.company_id AND company_members.user_id = auth.uid()));

CREATE POLICY "Company admins can manage communication settings" ON public.company_communication_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_communication_settings.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin')));

-- RLS Policies for company_competitors
CREATE POLICY "Company members can view competitors" ON public.company_competitors
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_competitors.company_id AND company_members.user_id = auth.uid()));

CREATE POLICY "Company admins can manage competitors" ON public.company_competitors
  FOR ALL USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_competitors.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin')));

-- RLS Policies for company_agent_preferences
CREATE POLICY "Company members can view agent preferences" ON public.company_agent_preferences
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_agent_preferences.company_id AND company_members.user_id = auth.uid()));

CREATE POLICY "Company admins can manage agent preferences" ON public.company_agent_preferences
  FOR ALL USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_agent_preferences.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin')));

-- RLS Policies for company_platform_settings
CREATE POLICY "Company members can view platform settings" ON public.company_platform_settings
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_platform_settings.company_id AND company_members.user_id = auth.uid()));

CREATE POLICY "Company admins can manage platform settings" ON public.company_platform_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_members.company_id = company_platform_settings.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin')));

-- Triggers for updated_at
CREATE TRIGGER update_company_schedule_config_updated_at BEFORE UPDATE ON public.company_schedule_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_marketing_goals_updated_at BEFORE UPDATE ON public.company_marketing_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_products_updated_at BEFORE UPDATE ON public.company_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_communication_settings_updated_at BEFORE UPDATE ON public.company_communication_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_competitors_updated_at BEFORE UPDATE ON public.company_competitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_agent_preferences_updated_at BEFORE UPDATE ON public.company_agent_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_platform_settings_updated_at BEFORE UPDATE ON public.company_platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();