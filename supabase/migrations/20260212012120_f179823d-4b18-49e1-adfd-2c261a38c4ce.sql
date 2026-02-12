
-- Drop old function with different return type
DROP FUNCTION IF EXISTS public.delete_company_cascade(UUID);

-- Create comprehensive delete_company_cascade
CREATE OR REPLACE FUNCTION public.delete_company_cascade(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CRM tables
  DELETE FROM crm_activities WHERE company_id = target_company_id;
  DELETE FROM crm_deals WHERE company_id = target_company_id;
  DELETE FROM crm_contacts WHERE company_id = target_company_id;
  DELETE FROM crm_accounts WHERE company_id = target_company_id;
  DELETE FROM crm_pipelines WHERE company_id = target_company_id;
  DELETE FROM crm_custom_fields WHERE company_id = target_company_id;
  DELETE FROM crm_tags WHERE company_id = target_company_id;

  -- Social
  DELETE FROM social_accounts WHERE company_id = target_company_id;

  -- Marketing
  DELETE FROM marketing_campaigns WHERE company_id = target_company_id;
  DELETE FROM company_marketing_goals WHERE company_id = target_company_id;

  -- Strategy & PTW
  DELETE FROM company_ptw_reviews WHERE company_id = target_company_id;
  DELETE FROM company_play_to_win WHERE company_id = target_company_id;
  DELETE FROM company_strategy WHERE company_id = target_company_id;
  DELETE FROM company_products WHERE company_id = target_company_id;
  DELETE FROM company_parameters WHERE company_id = target_company_id;
  DELETE FROM company_current_parameters WHERE company_id = target_company_id;

  -- Objectives
  DELETE FROM company_objective_progress WHERE company_id = target_company_id;
  DELETE FROM company_objectives WHERE company_id = target_company_id;

  -- Competitors
  DELETE FROM company_competitors WHERE company_id = target_company_id;
  DELETE FROM competitive_intelligence WHERE company_id = target_company_id;

  -- Audiences
  DELETE FROM company_audiences WHERE company_id = target_company_id;

  -- Branding & communication
  DELETE FROM company_branding WHERE company_id = target_company_id;
  DELETE FROM company_communication_settings WHERE company_id = target_company_id;

  -- AI Workforce
  DELETE FROM ai_workforce_team_tasks WHERE team_id IN (SELECT id FROM ai_workforce_teams WHERE company_id = target_company_id);
  DELETE FROM ai_workforce_team_members WHERE team_id IN (SELECT id FROM ai_workforce_teams WHERE company_id = target_company_id);
  DELETE FROM ai_workforce_teams WHERE company_id = target_company_id;

  -- Agents
  DELETE FROM agent_usage_log WHERE company_id = target_company_id;
  DELETE FROM company_agent_configurations WHERE company_id = target_company_id;
  DELETE FROM company_agent_preferences WHERE company_id = target_company_id;
  DELETE FROM company_enabled_agents WHERE company_id = target_company_id;
  DELETE FROM company_agents WHERE company_id = target_company_id;

  -- Metrics & health
  DELETE FROM business_health_snapshots WHERE company_id = target_company_id;
  DELETE FROM company_dashboard_metrics WHERE company_id = target_company_id;
  DELETE FROM revenue_tracking WHERE company_id = target_company_id;

  -- Platform settings
  DELETE FROM company_platform_settings WHERE company_id = target_company_id;
  DELETE FROM company_schedule_config WHERE company_id = target_company_id;
  DELETE FROM company_digital_presence WHERE company_id = target_company_id;

  -- Email
  DELETE FROM company_inbound_emails WHERE company_id = target_company_id;
  DELETE FROM company_inbound_email_config WHERE company_id = target_company_id;
  DELETE FROM company_email_config WHERE company_id = target_company_id;

  -- Onboarding & journeys
  DELETE FROM onboarding_wow_results WHERE company_id = target_company_id;
  DELETE FROM journey_enrollments WHERE company_id = target_company_id;
  DELETE FROM journey_definitions WHERE company_id = target_company_id;

  -- Whitelabel
  DELETE FROM whitelabel_reviews WHERE company_id = target_company_id;
  DELETE FROM whitelabel_deployments WHERE company_id = target_company_id;

  -- Push & invitations
  DELETE FROM push_subscriptions WHERE company_id = target_company_id;
  DELETE FROM company_invitations WHERE company_id = target_company_id;

  -- Credits
  DELETE FROM company_credits WHERE company_id = target_company_id;

  -- Members
  DELETE FROM company_members WHERE company_id = target_company_id;

  -- Company
  DELETE FROM companies WHERE id = target_company_id;
END;
$$;

-- Create company_credits table
CREATE TABLE IF NOT EXISTS public.company_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  available_credits INTEGER NOT NULL DEFAULT 100,
  total_credits_purchased INTEGER NOT NULL DEFAULT 100,
  total_credits_consumed INTEGER NOT NULL DEFAULT 0,
  last_recharge_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company credits"
  ON public.company_credits FOR SELECT
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Create deduct_company_credits RPC
CREATE OR REPLACE FUNCTION public.deduct_company_credits(
  _company_id UUID,
  _credits INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT available_credits INTO current_credits
  FROM company_credits WHERE company_id = _company_id FOR UPDATE;

  IF current_credits IS NULL OR current_credits < _credits THEN
    RETURN FALSE;
  END IF;

  UPDATE company_credits
  SET available_credits = available_credits - _credits,
      total_credits_consumed = total_credits_consumed + _credits,
      updated_at = now()
  WHERE company_id = _company_id;

  RETURN TRUE;
END;
$$;
