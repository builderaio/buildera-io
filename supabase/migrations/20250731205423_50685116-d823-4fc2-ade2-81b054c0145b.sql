-- Agregar nuevos tipos de función al enum para análisis de redes sociales
ALTER TYPE business_function_type ADD VALUE IF NOT EXISTS 'instagram_intelligent_analysis';
ALTER TYPE business_function_type ADD VALUE IF NOT EXISTS 'linkedin_intelligent_analysis';
ALTER TYPE business_function_type ADD VALUE IF NOT EXISTS 'facebook_intelligent_analysis';
ALTER TYPE business_function_type ADD VALUE IF NOT EXISTS 'tiktok_intelligent_analysis';

-- Ahora insertar las configuraciones de función
INSERT INTO public.business_function_configurations (
  function_name,
  display_name,
  description,
  required_model_type,
  configuration,
  is_active
) VALUES (
  'instagram_intelligent_analysis',
  'Análisis Inteligente de Instagram',
  'Genera insights y accionables basados en el análisis de posts de Instagram',
  'text_generation',
  '{"temperature": 0.7, "max_tokens": 2000, "top_p": 1.0}',
  true
), (
  'linkedin_intelligent_analysis',
  'Análisis Inteligente de LinkedIn',
  'Genera insights y accionables basados en el análisis de posts de LinkedIn',
  'text_generation',
  '{"temperature": 0.7, "max_tokens": 2000, "top_p": 1.0}',
  true
), (
  'facebook_intelligent_analysis',
  'Análisis Inteligente de Facebook',
  'Genera insights y accionables basados en el análisis de posts de Facebook',
  'text_generation',
  '{"temperature": 0.7, "max_tokens": 2000, "top_p": 1.0}',
  true
), (
  'tiktok_intelligent_analysis',
  'Análisis Inteligente de TikTok',
  'Genera insights y accionables basados en el análisis de posts de TikTok',
  'text_generation',
  '{"temperature": 0.7, "max_tokens": 2000, "top_p": 1.0}',
  true
) ON CONFLICT (function_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  configuration = EXCLUDED.configuration,
  is_active = EXCLUDED.is_active;