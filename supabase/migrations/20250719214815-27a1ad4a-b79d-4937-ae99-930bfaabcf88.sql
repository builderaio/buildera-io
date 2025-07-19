-- Actualizar datos existentes de groq para diferenciar del nuevo xAI
UPDATE public.llm_api_keys 
SET notes = CASE 
  WHEN provider = 'groq' THEN COALESCE(notes, '') || ' (Groq - Inferencia rápida)'
  ELSE notes 
END
WHERE provider = 'groq';

-- Agregar algunos datos de ejemplo para xAI
INSERT INTO public.llm_api_keys (provider, model_name, api_key_name, api_key_hash, key_last_four, status, usage_limit_monthly, cost_limit_monthly, notes, available_models) VALUES
('xai', 'grok-beta', 'xAI Grok Principal', 'xai-...hash...', 'k1l2', 'active', 800000, 300, 'API key principal para Grok de xAI', ARRAY['grok-beta', 'grok-vision-beta']);

-- Insertar datos de uso de muestra para xAI
INSERT INTO public.llm_api_usage (api_key_id, provider, model_name, usage_date, total_tokens, prompt_tokens, completion_tokens, total_requests, total_cost)
SELECT 
  id,
  'xai',
  'grok-beta',
  CURRENT_DATE - INTERVAL '1 day' * (random() * 30)::integer,
  (random() * 40000)::integer,
  (random() * 20000)::integer,
  (random() * 20000)::integer,
  (random() * 800)::integer,
  (random() * 30)::numeric(10,2)
FROM public.llm_api_keys 
WHERE provider = 'xai'
LIMIT 10;

-- Insertar datos de facturación para xAI
INSERT INTO public.llm_api_billing (api_key_id, provider, billing_period_start, billing_period_end, total_usage_tokens, total_cost, status)
SELECT 
  id,
  'xai',
  DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month',
  DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day',
  (random() * 400000)::integer,
  (random() * 250)::numeric(10,2),
  'pending'
FROM public.llm_api_keys 
WHERE provider = 'xai';