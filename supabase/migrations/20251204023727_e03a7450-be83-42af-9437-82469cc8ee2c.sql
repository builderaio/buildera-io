-- =====================================================
-- FASE 1: UNIFICACIÓN DE AGENTES - ARQUITECTURA AGENT-CENTRIC
-- =====================================================

-- Tabla maestra de agentes de la plataforma
CREATE TABLE public.platform_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  icon TEXT,
  
  -- Configuración de ejecución
  execution_type TEXT NOT NULL DEFAULT 'edge_function',
  edge_function_name TEXT,
  openai_assistant_id TEXT,
  n8n_workflow_id TEXT,
  
  -- Precios y límites
  credits_per_use INTEGER DEFAULT 1,
  is_premium BOOLEAN DEFAULT false,
  min_plan_required TEXT DEFAULT 'starter',
  
  -- Metadata
  sfia_skills JSONB DEFAULT '[]'::jsonb,
  input_schema JSONB DEFAULT '{}'::jsonb,
  output_schema JSONB DEFAULT '{}'::jsonb,
  sample_output JSONB DEFAULT NULL,
  
  -- Control
  is_active BOOLEAN DEFAULT true,
  is_onboarding_agent BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tracking de uso de agentes
CREATE TABLE public.agent_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.platform_agents(id) ON DELETE SET NULL,
  
  credits_consumed INTEGER DEFAULT 1,
  input_data JSONB,
  output_summary TEXT,
  output_data JSONB,
  execution_time_ms INTEGER,
  
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de agentes habilitados por empresa
CREATE TABLE public.company_enabled_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.platform_agents(id) ON DELETE CASCADE,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  enabled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  UNIQUE(company_id, agent_id)
);

-- Tabla de resultados del onboarding WOW
CREATE TABLE public.onboarding_wow_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  strategy_result JSONB,
  content_result JSONB,
  insights_result JSONB,
  
  total_execution_time_ms INTEGER,
  agents_executed TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_platform_agents_category ON public.platform_agents(category);
CREATE INDEX idx_platform_agents_active ON public.platform_agents(is_active);
CREATE INDEX idx_platform_agents_onboarding ON public.platform_agents(is_onboarding_agent);
CREATE INDEX idx_agent_usage_log_user ON public.agent_usage_log(user_id);
CREATE INDEX idx_agent_usage_log_company ON public.agent_usage_log(company_id);
CREATE INDEX idx_agent_usage_log_agent ON public.agent_usage_log(agent_id);
CREATE INDEX idx_agent_usage_log_created ON public.agent_usage_log(created_at DESC);
CREATE INDEX idx_company_enabled_agents_company ON public.company_enabled_agents(company_id);

-- RLS Policies
ALTER TABLE public.platform_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_enabled_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_wow_results ENABLE ROW LEVEL SECURITY;

-- Platform agents: todos pueden ver agentes activos
CREATE POLICY "Anyone can view active platform agents"
  ON public.platform_agents FOR SELECT
  USING (is_active = true);

-- Admins pueden gestionar agentes
CREATE POLICY "Admins can manage platform agents"
  ON public.platform_agents FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Agent usage log: usuarios ven su propio uso
CREATE POLICY "Users can view their own agent usage"
  ON public.agent_usage_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent usage"
  ON public.agent_usage_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Company enabled agents: miembros de empresa pueden ver/gestionar
CREATE POLICY "Company members can view enabled agents"
  ON public.company_enabled_agents FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Company admins can manage enabled agents"
  ON public.company_enabled_agents FOR ALL
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  ))
  WITH CHECK (company_id IN (
    SELECT cm.company_id FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  ));

-- Onboarding WOW results
CREATE POLICY "Users can view their own onboarding results"
  ON public.onboarding_wow_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding results"
  ON public.onboarding_wow_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INSERTAR AGENTES DE MARKETING INICIALES
-- =====================================================

INSERT INTO public.platform_agents (internal_code, name, description, category, icon, execution_type, edge_function_name, credits_per_use, is_premium, min_plan_required, is_onboarding_agent, sort_order) VALUES
-- Agentes de Onboarding (ejecutan automáticamente)
('MKTG_STRATEGIST', '🧠 Estratega de Marketing', 'Genera estrategias de marketing personalizadas basadas en el ADN de tu empresa', 'marketing', 'Brain', 'edge_function', 'marketing-hub-marketing-strategy', 2, false, 'starter', true, 1),
('CONTENT_CREATOR', '🎨 Creador de Contenido', 'Crea posts optimizados para redes sociales con copy persuasivo', 'content', 'Palette', 'edge_function', 'marketing-hub-post-creator', 1, false, 'starter', true, 2),
('INSIGHTS_GENERATOR', '💡 Generador de Insights', 'Analiza tu empresa y genera insights accionables para mejorar tu marketing', 'analytics', 'Lightbulb', 'edge_function', 'content-insights-generator', 1, false, 'starter', true, 3),

-- Agentes de Marketing
('CALENDAR_PLANNER', '📅 Planificador de Calendario', 'Genera calendarios de contenido estratégicos para semanas o meses', 'content', 'Calendar', 'edge_function', 'marketing-hub-content-calendar', 3, false, 'starter', false, 4),
('IMAGE_CREATOR', '🖼️ Creador de Imágenes', 'Genera imágenes profesionales para tus posts y campañas', 'content', 'Image', 'edge_function', 'marketing-hub-image-creator', 2, true, 'growth', false, 5),
('VIDEO_CREATOR', '🎬 Creador de Videos', 'Genera scripts y storyboards para videos y reels', 'content', 'Video', 'edge_function', 'marketing-hub-video-creator', 3, true, 'growth', false, 6),
('AUDIENCE_ANALYST', '📊 Analista de Audiencias', 'Analiza y segmenta tu audiencia para campañas más efectivas', 'analytics', 'Users', 'edge_function', 'ai-audience-generator', 2, false, 'starter', false, 7),
('CONTENT_PUBLISHER', '📤 Publicador Social', 'Publica contenido directamente en tus redes sociales conectadas', 'publishing', 'Send', 'edge_function', 'upload-post-manager', 1, false, 'starter', false, 8),

-- Agentes Premium
('CAMPAIGN_OPTIMIZER', '🎯 Optimizador de Campañas', 'Optimiza tus campañas con IA para maximizar conversiones', 'marketing', 'Target', 'edge_function', 'era-campaign-optimizer', 3, true, 'scale', false, 9),
('COMPETITIVE_INTEL', '🔍 Inteligencia Competitiva', 'Analiza a tu competencia y encuentra oportunidades de mercado', 'analytics', 'Search', 'edge_function', 'competitive-intelligence-agent', 5, true, 'scale', false, 10),
('BRAND_IDENTITY', '✨ Identidad de Marca', 'Define y refina la identidad visual y verbal de tu marca', 'branding', 'Sparkles', 'edge_function', 'brand-identity', 3, true, 'growth', false, 11),
('ERA_ASSISTANT', '🤖 Asistente ERA', 'Tu asistente personal de marketing con conocimiento de tu empresa', 'assistant', 'Bot', 'edge_function', 'era-chat', 1, false, 'starter', false, 12);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_platform_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_platform_agents_updated_at
  BEFORE UPDATE ON public.platform_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_agents_updated_at();