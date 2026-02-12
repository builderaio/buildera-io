-- Fix recursive agents: agents pointing to enterprise-autopilot-engine itself
-- Set edge_function_name to NULL and execution_type to 'pending'
UPDATE public.platform_agents 
SET edge_function_name = NULL, execution_type = 'pending'
WHERE internal_code IN (
  'CASHFLOW_MONITOR', 'EXPENSE_ANALYZER', 'REVENUE_FORECASTER',
  'JOB_PROFILER', 'CLIMATE_ANALYZER', 'TALENT_SCOUT',
  'COMPLIANCE_MONITOR', 'CONTRACT_REVIEWER',
  'PROCESS_OPTIMIZER', 'SLA_MONITOR'
) AND edge_function_name = 'enterprise-autopilot-engine';