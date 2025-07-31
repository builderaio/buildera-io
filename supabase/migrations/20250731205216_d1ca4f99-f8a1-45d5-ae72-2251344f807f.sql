-- Configurar funciones de análisis inteligente para redes sociales
-- Insertar configuración para análisis de Instagram si no existe
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
) ON CONFLICT (function_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  configuration = EXCLUDED.configuration,
  is_active = EXCLUDED.is_active;

-- Insertar configuración para análisis de LinkedIn si no existe
INSERT INTO public.business_function_configurations (
  function_name,
  display_name,
  description,
  required_model_type,
  configuration,
  is_active
) VALUES (
  'linkedin_intelligent_analysis',
  'Análisis Inteligente de LinkedIn',
  'Genera insights y accionables basados en el análisis de posts de LinkedIn',
  'text_generation',
  '{"temperature": 0.7, "max_tokens": 2000, "top_p": 1.0}',
  true
) ON CONFLICT (function_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  configuration = EXCLUDED.configuration,
  is_active = EXCLUDED.is_active;

-- Insertar configuración para análisis de Facebook si no existe
INSERT INTO public.business_function_configurations (
  function_name,
  display_name,
  description,
  required_model_type,
  configuration,
  is_active
) VALUES (
  'facebook_intelligent_analysis',
  'Análisis Inteligente de Facebook',
  'Genera insights y accionables basados en el análisis de posts de Facebook',
  'text_generation',
  '{"temperature": 0.7, "max_tokens": 2000, "top_p": 1.0}',
  true
) ON CONFLICT (function_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  configuration = EXCLUDED.configuration,
  is_active = EXCLUDED.is_active;

-- Insertar configuración para análisis de TikTok si no existe
INSERT INTO public.business_function_configurations (
  function_name,
  display_name,
  description,
  required_model_type,
  configuration,
  is_active
) VALUES (
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