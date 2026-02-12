
-- Seed autopilot_capabilities with predefined capabilities per department
INSERT INTO public.autopilot_capabilities (company_id, department, capability_code, capability_name, description, required_maturity, trigger_condition, required_data, is_active) 
SELECT 
  c.id as company_id,
  cap.department,
  cap.capability_code,
  cap.capability_name,
  cap.description,
  cap.required_maturity,
  cap.trigger_condition::jsonb,
  cap.required_data::jsonb,
  false
FROM companies c
CROSS JOIN (VALUES
  -- Marketing capabilities
  ('marketing', 'content_autopilot', 'Auto Content Generation', 'Automatically generate and schedule social media content based on brand voice and audience insights', 'starter', '{"min_posts": 10}', '{"needs": ["company_branding", "social_accounts"]}'),
  ('marketing', 'ab_testing_auto', 'A/B Testing Engine', 'Automatically create and test content variations to optimize engagement', 'growing', '{"min_posts": 100}', '{"needs": ["instagram_posts"]}'),
  ('marketing', 'audience_expansion', 'Audience Expansion', 'Identify and target new audience segments based on existing engagement patterns', 'established', '{"min_contacts": 200, "min_posts": 50}', '{"needs": ["company_audiences", "social_engagement"]}'),
  
  -- Sales capabilities
  ('sales', 'lead_scoring_auto', 'Automated Lead Scoring', 'Score and prioritize leads using AI-driven analysis of engagement and behavior', 'starter', '{"min_contacts": 20}', '{"needs": ["crm_contacts"]}'),
  ('sales', 'predictive_churn', 'Predictive Churn Detection', 'Predict customer churn risk and trigger retention actions automatically', 'growing', '{"min_deals": 50, "min_contacts": 50}', '{"needs": ["crm_deals", "crm_contacts"]}'),
  ('sales', 'cross_sell_engine', 'Cross-Sell Engine', 'Identify cross-sell and upsell opportunities based on product and deal data', 'established', '{"min_deals": 20}', '{"needs": ["crm_deals", "company_products"]}'),
  ('sales', 'pipeline_forecast', 'Pipeline Forecasting', 'AI-powered revenue forecasting based on pipeline health and historical patterns', 'growing', '{"min_deals": 30}', '{"needs": ["crm_deals"]}'),
  
  -- Finance capabilities
  ('finance', 'credit_optimizer', 'Credit Usage Optimizer', 'Optimize agent credit consumption to maximize ROI across departments', 'starter', '{"min_agent_executions": 10}', '{"needs": ["agent_usage_log"]}'),
  ('finance', 'budget_forecasting', 'Budget Forecasting', 'Predict credit consumption and budget needs based on usage patterns', 'growing', '{"min_agent_executions": 50}', '{"needs": ["agent_usage_log", "business_health_snapshots"]}'),
  ('finance', 'roi_analyzer', 'ROI Analyzer', 'Analyze return on investment per agent and department to guide resource allocation', 'established', '{"min_agent_executions": 100}', '{"needs": ["agent_usage_log", "business_health_snapshots"]}'),
  
  -- Legal capabilities
  ('legal', 'regulatory_monitor', 'Regulatory Monitor', 'Monitor regulatory changes in the company industry and country via external intelligence', 'growing', '{}', '{"needs": ["external_intelligence_cache"]}'),
  ('legal', 'compliance_checker', 'Compliance Checker', 'Automated compliance verification against industry standards and regulations', 'established', '{}', '{"needs": ["company_parameters"]}'),
  
  -- HR capabilities
  ('hr', 'talent_matcher', 'Talent Matcher', 'Match candidate profiles with company culture and role requirements using AI', 'established', '{}', '{"needs": ["company_members"]}'),
  ('hr', 'climate_analyzer', 'Climate Analyzer', 'Analyze team sentiment and organizational climate through data patterns', 'established', '{}', '{"needs": ["company_members"]}'),
  
  -- Operations capabilities
  ('operations', 'process_optimizer', 'Process Optimizer', 'Identify and optimize repetitive processes to reduce execution time', 'established', '{"min_agent_executions": 30}', '{"needs": ["ai_workforce_team_tasks"]}'),
  ('operations', 'bottleneck_detector', 'Bottleneck Detector', 'Detect operational bottlenecks in agent workflows and task pipelines', 'growing', '{"min_agent_executions": 20}', '{"needs": ["ai_workforce_team_tasks", "agent_usage_log"]}')
) AS cap(department, capability_code, capability_name, description, required_maturity, trigger_condition, required_data)
ON CONFLICT DO NOTHING;

-- Create department_execution_log table if not exists (referenced by enterprise engine)
CREATE TABLE IF NOT EXISTS public.department_execution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_id TEXT NOT NULL,
  department TEXT NOT NULL,
  phase TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  decisions_made JSONB DEFAULT '[]'::jsonb,
  actions_taken JSONB DEFAULT '[]'::jsonb,
  content_generated INTEGER DEFAULT 0,
  content_approved INTEGER DEFAULT 0,
  content_rejected INTEGER DEFAULT 0,
  content_pending_review INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  error_message TEXT,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.department_execution_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their company execution logs"
ON public.department_execution_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies WHERE companies.id = department_execution_log.company_id AND companies.created_by = auth.uid()
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_dept_exec_log_company_cycle ON public.department_execution_log(company_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_dept_exec_log_department ON public.department_execution_log(department, created_at DESC);
