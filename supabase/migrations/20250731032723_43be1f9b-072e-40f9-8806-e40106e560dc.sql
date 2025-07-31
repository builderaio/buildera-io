-- Eliminar asignaciones existentes para content_optimization si existen
DELETE FROM function_model_assignments 
WHERE function_config_id = '6d51019d-3778-4817-b320-0517fc358409';

-- Crear la asignación de modelo para content_optimization
INSERT INTO function_model_assignments (
  function_config_id,
  provider_id,
  model_id,
  model_parameters,
  priority,
  is_active
) VALUES (
  '6d51019d-3778-4817-b320-0517fc358409', -- content_optimization
  '7d1526dd-0592-471a-909c-11376a0f408a', -- openai
  '3926bb3c-2873-4299-8a6f-961164956a80', -- gpt-4o-mini
  '{
    "temperature": 0.7,
    "max_tokens": 500,
    "top_p": 1.0,
    "frequency_penalty": 0.1,
    "presence_penalty": 0.1
  }'::jsonb,
  1,
  true
);