-- Agregar plantilla para identidad visual si no existe
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

-- Verificar que existe la función content_optimization
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

-- Obtener los IDs necesarios para crear la asignación
DO $$
DECLARE
  function_config_id uuid;
  openai_provider_id uuid;
  gpt_model_id uuid;
  openai_api_key_id uuid;
BEGIN
  -- Obtener function config ID
  SELECT id INTO function_config_id 
  FROM business_function_configurations 
  WHERE function_name = 'content_optimization';
  
  -- Obtener provider OpenAI
  SELECT id INTO openai_provider_id 
  FROM ai_providers 
  WHERE name = 'openai' 
  LIMIT 1;
  
  -- Obtener modelo gpt-4o-mini
  SELECT id INTO gpt_model_id 
  FROM ai_provider_models 
  WHERE ai_provider_models.provider_id = openai_provider_id AND model_name = 'gpt-4o-mini'
  LIMIT 1;
  
  -- Obtener API key (si existe)
  SELECT id INTO openai_api_key_id 
  FROM llm_api_keys 
  WHERE provider = 'openai' AND status = 'active'
  LIMIT 1;
  
  -- Crear la asignación de modelo
  INSERT INTO function_model_assignments (
    function_config_id,
    provider_id,
    model_id,
    api_key_id,
    model_parameters,
    priority,
    is_active
  ) VALUES (
    function_config_id,
    openai_provider_id,
    gpt_model_id,
    openai_api_key_id,
    '{
      "temperature": 0.7,
      "max_tokens": 500,
      "top_p": 1.0,
      "frequency_penalty": 0.1,
      "presence_penalty": 0.1
    }'::jsonb,
    1,
    true
  ) ON CONFLICT (function_config_id) DO UPDATE SET
    provider_id = EXCLUDED.provider_id,
    model_id = EXCLUDED.model_id,
    api_key_id = EXCLUDED.api_key_id,
    model_parameters = EXCLUDED.model_parameters,
    updated_at = now();
    
END $$;