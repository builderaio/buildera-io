-- Agregar configuraciones de modelos AI para las funciones de análisis de marketing
INSERT INTO public.ai_model_assignments (
  business_function,
  ai_provider_id,
  ai_model_id,
  is_active,
  configuration
) VALUES 
-- Para content_analysis (usado por advanced-content-analyzer)
(
  'content_analysis',
  '7d1526dd-0592-471a-909c-11376a0f408a', -- OpenAI provider
  'f537858c-a237-40d4-8c95-7239993f5c62', -- GPT-4 model
  true,
  '{}'::jsonb
),
-- Para marketing_analysis (usado por advanced-social-analyzer)
(
  'marketing_analysis',
  '7d1526dd-0592-471a-909c-11376a0f408a', -- OpenAI provider  
  'f537858c-a237-40d4-8c95-7239993f5c62', -- GPT-4 model
  true,
  '{}'::jsonb
);