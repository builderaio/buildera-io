-- Agregar asignaciones de modelos AI para las 4 redes sociales principales

-- Insertar asignación para Facebook intelligent analysis
INSERT INTO public.ai_model_assignments (
  business_function,
  ai_provider_id,
  ai_model_id,
  is_active
) VALUES (
  'facebook-intelligent-analysis',
  (SELECT id FROM public.ai_providers WHERE name = 'openai'),
  (SELECT id FROM public.ai_models WHERE name = 'gpt-4o-mini'),
  true
) ON CONFLICT (business_function) DO NOTHING;

-- Insertar asignación para TikTok intelligent analysis (si no existe)
INSERT INTO public.ai_model_assignments (
  business_function,
  ai_provider_id,
  ai_model_id,
  is_active
) VALUES (
  'tiktok-intelligent-analysis',
  (SELECT id FROM public.ai_providers WHERE name = 'openai'),
  (SELECT id FROM public.ai_models WHERE name = 'gpt-4o-mini'),
  true
) ON CONFLICT (business_function) DO NOTHING;

-- Insertar asignación para LinkedIn intelligent analysis (si no existe)
INSERT INTO public.ai_model_assignments (
  business_function,
  ai_provider_id,
  ai_model_id,
  is_active
) VALUES (
  'linkedin-intelligent-analysis',
  (SELECT id FROM public.ai_providers WHERE name = 'openai'),
  (SELECT id FROM public.ai_models WHERE name = 'gpt-4o-mini'),
  true
) ON CONFLICT (business_function) DO NOTHING;

-- Insertar asignación para Instagram intelligent analysis (si no existe)
INSERT INTO public.ai_model_assignments (
  business_function,
  ai_provider_id,
  ai_model_id,
  is_active
) VALUES (
  'instagram-intelligent-analysis',
  (SELECT id FROM public.ai_providers WHERE name = 'openai'),
  (SELECT id FROM public.ai_models WHERE name = 'gpt-4o-mini'),
  true
) ON CONFLICT (business_function) DO NOTHING;