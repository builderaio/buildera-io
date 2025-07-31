-- Agregar plantilla para identidad visual
INSERT INTO era_prompt_templates (field_type, system_prompt, specific_instructions, tone, max_words, is_active)
VALUES (
  'identidad visual',
  'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
  'Optimiza esta IDENTIDAD VISUAL empresarial:
- Debe reflejar los valores de la marca
- Coherente con la propuesta de valor
- Apropiada para el público objetivo
- Profesional y memorable
- Máximo 150 palabras',
  'creative',
  150,
  true
) ON CONFLICT (field_type) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  specific_instructions = EXCLUDED.specific_instructions,
  tone = EXCLUDED.tone,
  max_words = EXCLUDED.max_words,
  updated_at = now();

-- Crear configuración para content_optimization
INSERT INTO business_function_configurations (
  function_name,
  display_name,
  description,
  required_model_type,
  is_active
) VALUES (
  'content_optimization',
  'Optimización de Contenido',
  'Optimiza contenido empresarial usando Era',
  'text_generation',
  true
) ON CONFLICT (function_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insertar asignación de modelo directamente con valores conocidos
-- (Esto requiere que ya existan los registros de providers y models)
INSERT INTO function_model_assignments (
  function_config_id,
  provider_id,
  model_id,
  model_parameters,
  priority,
  is_active
) 
SELECT 
  bfc.id as function_config_id,
  ap.id as provider_id,
  apm.id as model_id,
  '{
    "temperature": 0.7,
    "max_tokens": 500,
    "top_p": 1.0,
    "frequency_penalty": 0.1,
    "presence_penalty": 0.1
  }'::jsonb as model_parameters,
  1 as priority,
  true as is_active
FROM business_function_configurations bfc
CROSS JOIN ai_providers ap
CROSS JOIN ai_provider_models apm
WHERE bfc.function_name = 'content_optimization'
  AND ap.name = 'openai'
  AND apm.model_name = 'gpt-4o-mini'
  AND apm.provider_id = ap.id
ON CONFLICT (function_config_id) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  model_id = EXCLUDED.model_id,
  model_parameters = EXCLUDED.model_parameters,
  updated_at = now();