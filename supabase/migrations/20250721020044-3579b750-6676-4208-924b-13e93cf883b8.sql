-- Agregar Groq como proveedor de IA
INSERT INTO public.ai_providers (name, display_name, description, base_url, env_key, supported_model_types) VALUES
('groq', 'Groq', 'Groq LPU inference for ultra-fast AI processing', 'https://api.groq.com/openai/v1', 'GROQ_API_KEY', ARRAY['text_generation', 'reasoning']::ai_model_type[])
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  base_url = EXCLUDED.base_url,
  env_key = EXCLUDED.env_key,
  supported_model_types = EXCLUDED.supported_model_types,
  updated_at = now();