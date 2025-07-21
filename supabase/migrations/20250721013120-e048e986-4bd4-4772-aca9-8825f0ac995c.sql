-- Crear enum para tipos de modelos de IA
CREATE TYPE ai_model_type AS ENUM (
  'text_generation',
  'image_generation', 
  'audio_generation',
  'video_generation',
  'reasoning'
);

-- Crear enum para tipos de funciones de negocio
CREATE TYPE business_function_type AS ENUM (
  'content_optimization',
  'content_generation',
  'chat_assistant',
  'image_creation',
  'audio_synthesis',
  'video_creation',
  'data_analysis',
  'competitive_intelligence'
);

-- Tabla para proveedores de IA
CREATE TABLE public.ai_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  base_url TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'bearer', -- bearer, api_key, custom
  env_key TEXT NOT NULL,
  supported_model_types ai_model_type[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para modelos específicos por proveedor
CREATE TABLE public.ai_provider_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.ai_providers(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  model_type ai_model_type NOT NULL,
  capabilities JSONB DEFAULT '{}',
  pricing_info JSONB DEFAULT '{}',
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, model_name)
);

-- Tabla para configuración de funciones de negocio
CREATE TABLE public.business_function_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name business_function_type NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  required_model_type ai_model_type NOT NULL,
  default_provider_id UUID REFERENCES public.ai_providers(id),
  default_model_id UUID REFERENCES public.ai_provider_models(id),
  configuration JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(function_name)
);

-- Tabla para asignaciones específicas de modelo por función
CREATE TABLE public.function_model_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_config_id UUID NOT NULL REFERENCES public.business_function_configurations(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.ai_providers(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.ai_provider_models(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.llm_api_keys(id),
  model_parameters JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(function_config_id, provider_id)
);

-- Insertar proveedores predeterminados
INSERT INTO public.ai_providers (name, display_name, description, base_url, env_key, supported_model_types) VALUES
('openai', 'OpenAI', 'OpenAI GPT models and DALL-E', 'https://api.openai.com/v1', 'OPENAI_API_KEY', ARRAY['text_generation', 'image_generation', 'reasoning']::ai_model_type[]),
('anthropic', 'Anthropic', 'Claude models for reasoning and text generation', 'https://api.anthropic.com/v1', 'ANTHROPIC_API_KEY', ARRAY['text_generation', 'reasoning']::ai_model_type[]),
('google', 'Google AI', 'Gemini models for multimodal AI', 'https://generativelanguage.googleapis.com/v1beta', 'GOOGLE_API_KEY', ARRAY['text_generation', 'reasoning']::ai_model_type[]),
('xai', 'xAI', 'Grok models for reasoning and text generation', 'https://api.x.ai/v1', 'XAI_API_KEY', ARRAY['text_generation', 'reasoning']::ai_model_type[]),
('huggingface', 'Hugging Face', 'Various open-source models', 'https://api-inference.huggingface.co', 'HUGGING_FACE_ACCESS_TOKEN', ARRAY['text_generation', 'image_generation']::ai_model_type[]);

-- Insertar funciones de negocio predeterminadas
INSERT INTO public.business_function_configurations (function_name, display_name, description, required_model_type) VALUES
('content_optimization', 'Optimización de Contenido ERA', 'Optimiza contenido empresarial usando IA', 'text_generation'),
('chat_assistant', 'Asistente de Chat ERA', 'Asistente conversacional inteligente', 'text_generation'),
('content_generation', 'Generación de Contenido', 'Genera contenido de marketing y empresarial', 'text_generation'),
('image_creation', 'Creación de Imágenes', 'Genera imágenes usando IA', 'image_generation'),
('data_analysis', 'Análisis de Datos', 'Análisis inteligente de datos empresariales', 'reasoning'),
('competitive_intelligence', 'Inteligencia Competitiva', 'Análisis de competencia y mercado', 'reasoning');

-- Habilitar RLS
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_function_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.function_model_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para administradores
CREATE POLICY "Admins can manage AI providers" ON public.ai_providers FOR ALL USING (true);
CREATE POLICY "Admins can manage AI provider models" ON public.ai_provider_models FOR ALL USING (true);
CREATE POLICY "Admins can manage business function configurations" ON public.business_function_configurations FOR ALL USING (true);
CREATE POLICY "Admins can manage function model assignments" ON public.function_model_assignments FOR ALL USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_ai_providers_updated_at
  BEFORE UPDATE ON public.ai_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_provider_models_updated_at
  BEFORE UPDATE ON public.ai_provider_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_function_configurations_updated_at
  BEFORE UPDATE ON public.business_function_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_function_model_assignments_updated_at
  BEFORE UPDATE ON public.function_model_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();