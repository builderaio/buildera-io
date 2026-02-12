
-- =====================================================
-- ENTERPRISE AUTOPILOT: Tables + New Agents
-- =====================================================

-- Department config table
CREATE TABLE public.company_department_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  autopilot_enabled BOOLEAN NOT NULL DEFAULT false,
  maturity_level_required TEXT NOT NULL DEFAULT 'starter',
  allowed_actions TEXT[] NOT NULL DEFAULT '{}',
  guardrails JSONB DEFAULT '{}',
  execution_frequency TEXT NOT NULL DEFAULT 'daily',
  last_execution_at TIMESTAMPTZ,
  next_execution_at TIMESTAMPTZ,
  auto_unlocked BOOLEAN NOT NULL DEFAULT false,
  auto_unlocked_at TIMESTAMPTZ,
  total_cycles_run INTEGER NOT NULL DEFAULT 0,
  max_credits_per_cycle INTEGER NOT NULL DEFAULT 10,
  require_human_approval BOOLEAN NOT NULL DEFAULT true,
  active_hours JSONB DEFAULT '{"start": "08:00", "end": "20:00"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, department)
);

ALTER TABLE public.company_department_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company department configs"
  ON public.company_department_config FOR SELECT
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Users can insert department configs for their companies"
  ON public.company_department_config FOR INSERT
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Users can update their company department configs"
  ON public.company_department_config FOR UPDATE
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Users can delete their company department configs"
  ON public.company_department_config FOR DELETE
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE INDEX idx_dept_config_company ON public.company_department_config(company_id);
CREATE INDEX idx_dept_config_department ON public.company_department_config(department);

CREATE TRIGGER update_company_department_config_updated_at
  BEFORE UPDATE ON public.company_department_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Department execution log
CREATE TABLE public.department_execution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  cycle_id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  phase TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  context_snapshot JSONB,
  decisions_made JSONB,
  actions_taken JSONB,
  guardrail_results JSONB,
  credits_consumed INTEGER NOT NULL DEFAULT 0,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.department_execution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company department logs"
  ON public.department_execution_log FOR SELECT
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Service role can insert department logs"
  ON public.department_execution_log FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_dept_exec_company ON public.department_execution_log(company_id);
CREATE INDEX idx_dept_exec_created ON public.department_execution_log(created_at DESC);

-- =====================================================
-- INSERT NEW ENTERPRISE AGENTS
-- =====================================================

-- Sales
INSERT INTO public.platform_agents (internal_code, name, description, category, icon, execution_type, edge_function_name, credits_per_use, is_premium, min_plan_required, is_onboarding_agent, sort_order, is_active) VALUES
('SALES_PIPELINE_OPTIMIZER', 'Sales Pipeline Optimizer', 'Analyzes CRM deals, identifies stalled opportunities, and suggests prioritized actions to accelerate pipeline velocity.', 'sales', 'TrendingUp', 'edge_function', 'enterprise-autopilot-engine', 3, false, 'starter', false, 200, true),
('LEAD_SCORER', 'AI Lead Scorer', 'Automatically scores and ranks leads based on engagement signals, company fit, and buying intent from CRM data.', 'sales', 'Target', 'edge_function', 'enterprise-autopilot-engine', 2, false, 'starter', false, 201, true),
('PROPOSAL_GENERATOR', 'Proposal Generator', 'Generates customized commercial proposals based on deal context, company products, and client needs.', 'sales', 'FileText', 'edge_function', 'enterprise-autopilot-engine', 5, true, 'growth', false, 202, true);

-- Finance
INSERT INTO public.platform_agents (internal_code, name, description, category, icon, execution_type, edge_function_name, credits_per_use, is_premium, min_plan_required, is_onboarding_agent, sort_order, is_active) VALUES
('CASHFLOW_MONITOR', 'Cashflow Monitor', 'Monitors credit consumption, projects runway, and alerts on unusual spending patterns in real-time.', 'finance', 'DollarSign', 'edge_function', 'enterprise-autopilot-engine', 2, false, 'starter', false, 210, true),
('REVENUE_FORECASTER', 'Revenue Forecaster', 'Projects revenue based on pipeline data, historical conversion rates, and market trends.', 'finance', 'LineChart', 'edge_function', 'enterprise-autopilot-engine', 4, true, 'growth', false, 211, true),
('EXPENSE_ANALYZER', 'Expense Analyzer', 'Analyzes spending patterns, identifies optimization opportunities, and recommends budget reallocation.', 'finance', 'PieChart', 'edge_function', 'enterprise-autopilot-engine', 3, true, 'growth', false, 212, true);

-- Legal
INSERT INTO public.platform_agents (internal_code, name, description, category, icon, execution_type, edge_function_name, credits_per_use, is_premium, min_plan_required, is_onboarding_agent, sort_order, is_active) VALUES
('CONTRACT_REVIEWER', 'Contract Reviewer', 'Reviews contracts and agreements using AI to identify risks, missing clauses, and compliance issues.', 'legal', 'Scale', 'edge_function', 'enterprise-autopilot-engine', 5, true, 'growth', false, 220, true),
('COMPLIANCE_MONITOR', 'Compliance Monitor', 'Monitors regulatory compliance, tracks deadlines, and alerts on potential violations before they occur.', 'legal', 'Shield', 'edge_function', 'enterprise-autopilot-engine', 3, true, 'growth', false, 221, true);

-- HR
INSERT INTO public.platform_agents (internal_code, name, description, category, icon, execution_type, edge_function_name, credits_per_use, is_premium, min_plan_required, is_onboarding_agent, sort_order, is_active) VALUES
('JOB_PROFILER', 'Job Profiler', 'Generates comprehensive job profiles with required skills, responsibilities, and compensation benchmarks.', 'hr', 'UserPlus', 'edge_function', 'enterprise-autopilot-engine', 3, true, 'scale', false, 230, true),
('CLIMATE_ANALYZER', 'Climate Analyzer', 'Analyzes team climate indicators, satisfaction patterns, and recommends actions to improve workplace culture.', 'hr', 'Heart', 'edge_function', 'enterprise-autopilot-engine', 4, true, 'scale', false, 231, true),
('TALENT_SCOUT', 'Talent Scout', 'Matches talent profiles against open positions using AI-driven skill analysis and cultural fit assessment.', 'hr', 'Search', 'edge_function', 'enterprise-autopilot-engine', 4, true, 'scale', false, 232, true);

-- Operations
INSERT INTO public.platform_agents (internal_code, name, description, category, icon, execution_type, edge_function_name, credits_per_use, is_premium, min_plan_required, is_onboarding_agent, sort_order, is_active) VALUES
('PROCESS_OPTIMIZER', 'Process Optimizer', 'Identifies bottlenecks in business processes, recommends automation opportunities, and measures efficiency gains.', 'operations', 'Workflow', 'edge_function', 'enterprise-autopilot-engine', 4, true, 'scale', false, 240, true),
('SLA_MONITOR', 'SLA Monitor', 'Monitors service level agreements, tracks performance metrics, and proactively alerts on SLA breach risks.', 'operations', 'Clock', 'edge_function', 'enterprise-autopilot-engine', 3, true, 'scale', false, 241, true),
('TASK_AUTOMATOR', 'Task Automator', 'Identifies repetitive manual tasks and creates automated workflows to eliminate them, freeing up team capacity.', 'operations', 'Zap', 'edge_function', 'enterprise-autopilot-engine', 3, true, 'scale', false, 242, true);
