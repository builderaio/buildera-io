-- Crear asignación de modelo para advanced_marketing_analysis
INSERT INTO ai_model_assignments (ai_model_id, ai_provider_id, business_function, is_active)
SELECT 
    am.id as ai_model_id,
    ap.id as ai_provider_id,
    'advanced_marketing_analysis' as business_function,
    true as is_active
FROM ai_models am
JOIN ai_providers ap ON am.provider_id = ap.id
WHERE ap.name = 'openai' 
  AND am.name = 'gpt-4o-mini'
  AND NOT EXISTS (
    SELECT 1 FROM ai_model_assignments 
    WHERE business_function = 'advanced_marketing_analysis'
  )
LIMIT 1;