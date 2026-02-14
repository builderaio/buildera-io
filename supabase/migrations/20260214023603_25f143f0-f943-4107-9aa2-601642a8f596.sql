-- Fix delete_user_cascade: remove reference to non-existent learning_progress table
CREATE OR REPLACE FUNCTION public.delete_user_cascade(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nullify platform_agents created_by (has NO ACTION constraint)
  UPDATE public.platform_agents SET created_by = NULL WHERE created_by = target_user_id;
  
  -- Delete from public tables that reference user_id
  DELETE FROM public.company_agent_configurations WHERE user_id = target_user_id;
  DELETE FROM public.company_agents WHERE user_id = target_user_id;
  DELETE FROM public.company_audiences WHERE user_id = target_user_id;
  DELETE FROM public.audience_insights WHERE user_id = target_user_id;
  DELETE FROM public.ai_tutor_sessions WHERE user_id = target_user_id;
  DELETE FROM public.ai_assessments WHERE user_id = target_user_id;
  DELETE FROM public.security_events WHERE user_id = target_user_id;
  DELETE FROM public.company_dashboard_metrics WHERE user_id = target_user_id;
  
  -- Delete the user from auth.users - cascades to profiles, company_members, etc.
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Fix delete_company_cascade: fix company_dashboard_metrics (uses user_id, not company_id)
-- and remove reference to non-existent tables
CREATE OR REPLACE FUNCTION public.delete_company_cascade(target_company_id uuid)
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

  -- Autopilot
  DELETE FROM autopilot_decisions WHERE company_id = target_company_id;
  DELETE FROM autopilot_execution_log WHERE company_id = target_company_id;
  DELETE FROM autopilot_memory WHERE company_id = target_company_id;
  DELETE FROM autopilot_capabilities WHERE company_id = target_company_id;
  DELETE FROM company_autopilot_config WHERE company_id = target_company_id;

  -- Department config
  DELETE FROM company_department_config WHERE company_id = target_company_id;

  -- Members
  DELETE FROM company_members WHERE company_id = target_company_id;

  -- Company
  DELETE FROM companies WHERE id = target_company_id;
END;
$$;