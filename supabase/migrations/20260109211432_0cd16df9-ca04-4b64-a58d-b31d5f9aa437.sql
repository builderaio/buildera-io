-- Fase 1: Corregir vistas SECURITY DEFINER (convertir a SECURITY INVOKER)
-- Fase 2: Limpiar datos históricos

-- 2.1 Limpiar prefijo "Onboarding WOW - " de registros históricos
UPDATE public.agent_usage_log 
SET output_summary = REPLACE(output_summary, 'Onboarding WOW - ', '') 
WHERE output_summary LIKE 'Onboarding WOW - %';

-- 2.2 Marcar registros stuck como timeout
UPDATE public.agent_usage_log 
SET 
  status = 'timeout', 
  error_message = 'Execution timed out automatically'
WHERE status = 'running' 
  AND created_at < NOW() - INTERVAL '1 hour';