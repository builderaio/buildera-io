-- Create table for AI function configurations (centralized)
CREATE TABLE IF NOT EXISTS public.ai_function_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  
  -- Model Configuration
  provider TEXT NOT NULL DEFAULT 'openai',
  model_name TEXT NOT NULL DEFAULT 'gpt-4.1',
  api_version TEXT DEFAULT 'responses',
  
  -- Prompt Configuration
  system_prompt TEXT,
  instructions TEXT,
  
  -- Model Parameters
  temperature NUMERIC DEFAULT 0.7,
  max_output_tokens INTEGER DEFAULT 2000,
  top_p NUMERIC DEFAULT 1.0,
  
  -- Tools Configuration
  tools_enabled JSONB DEFAULT '[]'::jsonb,
  tools_config JSONB DEFAULT '{}'::jsonb,
  
  -- Function Calling
  custom_functions JSONB DEFAULT '[]'::jsonb,
  tool_choice TEXT DEFAULT 'auto',
  parallel_tool_calls BOOLEAN DEFAULT true,
  
  -- Reasoning (for o-series models)
  reasoning_enabled BOOLEAN DEFAULT false,
  reasoning_effort TEXT DEFAULT 'medium',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  requires_web_search BOOLEAN DEFAULT false,
  supports_streaming BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for model-tool compatibility
CREATE TABLE IF NOT EXISTS public.ai_model_tool_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  display_name TEXT,
  supports_web_search BOOLEAN DEFAULT false,
  supports_file_search BOOLEAN DEFAULT false,
  supports_code_interpreter BOOLEAN DEFAULT false,
  supports_image_generation BOOLEAN DEFAULT false,
  supports_reasoning BOOLEAN DEFAULT false,
  supports_responses_api BOOLEAN DEFAULT true,
  max_output_tokens INTEGER DEFAULT 4096,
  context_window INTEGER DEFAULT 128000,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(model_name, provider)
);

-- Enable RLS
ALTER TABLE public.ai_function_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_tool_compatibility ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_function_configurations
CREATE POLICY "Only admins can manage AI function configurations"
ON public.ai_function_configurations
FOR ALL
USING (public.current_user_is_admin());

-- RLS Policies for ai_model_tool_compatibility
CREATE POLICY "Only admins can manage AI model compatibility"
ON public.ai_model_tool_compatibility
FOR ALL
USING (public.current_user_is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_ai_function_configurations_updated_at
  BEFORE UPDATE ON public.ai_function_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();

-- Insert default model compatibility data
INSERT INTO public.ai_model_tool_compatibility (model_name, provider, display_name, supports_web_search, supports_file_search, supports_code_interpreter, supports_reasoning, supports_responses_api, max_output_tokens, context_window) VALUES
('gpt-4.1', 'openai', 'GPT-4.1', true, true, true, false, true, 32768, 1047576),
('gpt-4.1-mini', 'openai', 'GPT-4.1 Mini', true, true, true, false, true, 16384, 1047576),
('gpt-4.1-nano', 'openai', 'GPT-4.1 Nano', false, false, false, false, true, 16384, 1047576),
('gpt-4o', 'openai', 'GPT-4o', true, true, true, false, true, 16384, 128000),
('gpt-4o-mini', 'openai', 'GPT-4o Mini', true, true, true, false, true, 16384, 128000),
('o1', 'openai', 'O1', true, true, true, true, true, 100000, 200000),
('o1-mini', 'openai', 'O1 Mini', false, false, false, true, true, 65536, 128000),
('o1-pro', 'openai', 'O1 Pro', true, true, true, true, true, 100000, 200000),
('o3-mini', 'openai', 'O3 Mini', true, true, true, true, true, 100000, 200000)
ON CONFLICT (model_name, provider) DO NOTHING;

-- Insert default function configurations for key functions
INSERT INTO public.ai_function_configurations (function_name, display_name, description, category, model_name, system_prompt, tools_enabled, requires_web_search) VALUES
('campaign-ai-generator', 'Generador de Campañas', 'Genera sugerencias de campañas de marketing personalizadas', 'marketing', 'gpt-4.1', 'Eres un experto en marketing digital que genera campañas efectivas basadas en el contexto de la empresa.', '["web_search_preview"]', true),
('competitive-intelligence-agent', 'Inteligencia Competitiva', 'Analiza competidores y genera insights estratégicos', 'analytics', 'gpt-4.1', 'Eres un analista de inteligencia competitiva experto en identificar fortalezas y debilidades de competidores.', '["web_search_preview"]', true),
('instagram-intelligent-analysis', 'Análisis Instagram', 'Analiza posts de Instagram y genera insights de marketing', 'social_analytics', 'gpt-4.1-mini', 'Eres un experto en análisis de redes sociales especializado en Instagram.', '[]', false),
('linkedin-intelligent-analysis', 'Análisis LinkedIn', 'Analiza posts de LinkedIn y genera insights profesionales', 'social_analytics', 'gpt-4.1-mini', 'Eres un experto en análisis de redes sociales especializado en LinkedIn B2B.', '[]', false),
('facebook-intelligent-analysis', 'Análisis Facebook', 'Analiza contenido de Facebook y genera insights', 'social_analytics', 'gpt-4.1-mini', 'Eres un experto en análisis de redes sociales especializado en Facebook.', '[]', false),
('tiktok-intelligent-analysis', 'Análisis TikTok', 'Analiza videos de TikTok y genera insights de engagement', 'social_analytics', 'gpt-4.1-mini', 'Eres un experto en análisis de redes sociales especializado en TikTok.', '[]', false),
('generate-business-objectives', 'Generador de Objetivos', 'Genera objetivos de negocio basados en diagnóstico', 'strategy', 'gpt-4.1', 'Eres un consultor estratégico experto en definir objetivos SMART para empresas.', '["web_search_preview"]', true),
('content-insights-generator', 'Generador de Insights', 'Genera insights de contenido basados en análisis de audiencia', 'content', 'gpt-4.1-mini', 'Eres un estratega de contenido experto en identificar oportunidades de contenido.', '[]', false),
('audience-intelligence-analysis', 'Inteligencia de Audiencia', 'Analiza audiencias y genera segmentos objetivo', 'analytics', 'gpt-4.1', 'Eres un experto en análisis de audiencias y segmentación de mercado.', '[]', false),
('ai-audience-generator', 'Generador de Audiencias', 'Genera perfiles de audiencia basados en datos de empresa', 'analytics', 'gpt-4.1', 'Eres un experto en creación de buyer personas y segmentación de audiencias.', '[]', false),
('brand-identity', 'Identidad de Marca', 'Genera identidad visual y de marca', 'branding', 'gpt-4.1', 'Eres un experto en branding y diseño de identidad corporativa.', '[]', false),
('era-chat', 'Chat ERA', 'Asistente de marketing conversacional', 'assistant', 'gpt-4.1-mini', 'Eres ERA, el asistente de marketing de Buildera. Ayudas a los usuarios con estrategias de marketing.', '["web_search_preview"]', true)
ON CONFLICT (function_name) DO NOTHING;