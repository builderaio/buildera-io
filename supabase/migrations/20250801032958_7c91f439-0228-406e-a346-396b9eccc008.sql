-- Crear tablas para configuración de AI y asignaciones de modelos

-- Tabla para modelos AI disponibles
CREATE TABLE IF NOT EXISTS public.ai_models (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  provider_id uuid REFERENCES public.ai_providers(id),
  model_type text NOT NULL CHECK (model_type IN ('text-generation', 'text-embedding', 'image-generation', 'audio-generation')),
  max_tokens integer,
  supports_streaming boolean DEFAULT false,
  cost_per_token numeric(10, 8),
  is_active boolean DEFAULT true,
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla para asignaciones de modelos por función de negocio
CREATE TABLE IF NOT EXISTS public.ai_model_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_function text NOT NULL UNIQUE,
  ai_provider_id uuid REFERENCES public.ai_providers(id),
  ai_model_id uuid REFERENCES public.ai_models(id),
  is_active boolean DEFAULT true,
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertar modelos OpenAI
INSERT INTO public.ai_models (name, display_name, provider_id, model_type, max_tokens, supports_streaming, cost_per_token) VALUES
('gpt-4o-mini', 'GPT-4o Mini', (SELECT id FROM public.ai_providers WHERE name = 'openai'), 'text-generation', 128000, true, 0.00000015),
('text-embedding-3-small', 'Text Embedding 3 Small', (SELECT id FROM public.ai_providers WHERE name = 'openai'), 'text-embedding', 8191, false, 0.00000002)
ON CONFLICT (name) DO NOTHING;

-- Insertar asignaciones para las 4 redes sociales
INSERT INTO public.ai_model_assignments (business_function, ai_provider_id, ai_model_id, is_active) VALUES
('instagram-intelligent-analysis', (SELECT id FROM public.ai_providers WHERE name = 'openai'), (SELECT id FROM public.ai_models WHERE name = 'gpt-4o-mini'), true),
('linkedin-intelligent-analysis', (SELECT id FROM public.ai_providers WHERE name = 'openai'), (SELECT id FROM public.ai_models WHERE name = 'gpt-4o-mini'), true),
('tiktok-intelligent-analysis', (SELECT id FROM public.ai_providers WHERE name = 'openai'), (SELECT id FROM public.ai_models WHERE name = 'gpt-4o-mini'), true),
('facebook-intelligent-analysis', (SELECT id FROM public.ai_providers WHERE name = 'openai'), (SELECT id FROM public.ai_models WHERE name = 'gpt-4o-mini'), true),
('content-embeddings-generator', (SELECT id FROM public.ai_providers WHERE name = 'openai'), (SELECT id FROM public.ai_models WHERE name = 'text-embedding-3-small'), true),
('advanced-content-analyzer', (SELECT id FROM public.ai_providers WHERE name = 'openai'), (SELECT id FROM public.ai_models WHERE name = 'gpt-4o-mini'), true)
ON CONFLICT (business_function) DO NOTHING;