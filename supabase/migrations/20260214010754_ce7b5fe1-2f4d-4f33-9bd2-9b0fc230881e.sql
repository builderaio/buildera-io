-- RPC to delete a user and all associated data
-- First nullifies platform_agents.created_by (NO ACTION constraint), then deletes from auth.users which cascades to all other tables
CREATE OR REPLACE FUNCTION public.delete_user_cascade(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nullify platform_agents created_by (has NO ACTION constraint)
  UPDATE public.platform_agents SET created_by = NULL WHERE created_by = target_user_id;
  
  -- Delete from all public tables that reference user_id but might not cascade from auth.users
  -- (safety net for any tables without proper FK cascade)
  DELETE FROM public.company_agent_configurations WHERE user_id = target_user_id;
  DELETE FROM public.company_agents WHERE user_id = target_user_id;
  DELETE FROM public.company_audiences WHERE user_id = target_user_id;
  DELETE FROM public.audience_insights WHERE user_id = target_user_id;
  DELETE FROM public.ai_tutor_sessions WHERE user_id = target_user_id;
  DELETE FROM public.ai_assessments WHERE user_id = target_user_id;
  DELETE FROM public.learning_progress WHERE user_id = target_user_id;
  DELETE FROM public.security_events WHERE user_id = target_user_id;
  
  -- Delete the user from auth.users - this will CASCADE to profiles, company_members, 
  -- user_subscriptions, agent_usage_log, and all other tables with ON DELETE CASCADE
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;