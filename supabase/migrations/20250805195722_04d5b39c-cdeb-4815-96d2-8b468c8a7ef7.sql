-- Fix the remaining search_path security issues - Part 3

-- Fix get_admin_user_analytics function
CREATE OR REPLACE FUNCTION public.get_admin_user_analytics()
 RETURNS TABLE(total_users bigint, recent_users bigint, companies bigint, developers bigint, experts bigint, users_with_linkedin bigint, users_with_facebook bigint, users_with_tiktok bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_users,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::bigint as recent_users,
    COUNT(*) FILTER (WHERE user_type = 'company')::bigint as companies,
    COUNT(*) FILTER (WHERE user_type = 'developer')::bigint as developers,
    COUNT(*) FILTER (WHERE user_type = 'expert')::bigint as experts,
    (SELECT COUNT(*)::bigint FROM linkedin_connections)::bigint as users_with_linkedin,
    (SELECT COUNT(*)::bigint FROM facebook_instagram_connections)::bigint as users_with_facebook,
    (SELECT COUNT(*)::bigint FROM tiktok_connections)::bigint as users_with_tiktok
  FROM profiles;
END;
$function$;

-- Fix update_updated_at_trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix get_admin_social_connections function
CREATE OR REPLACE FUNCTION public.get_admin_social_connections()
 RETURNS TABLE(linkedin_connections bigint, facebook_connections bigint, tiktok_connections bigint, recent_linkedin bigint, recent_facebook bigint, recent_tiktok bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::bigint FROM linkedin_connections)::bigint as linkedin_connections,
    (SELECT COUNT(*)::bigint FROM facebook_instagram_connections)::bigint as facebook_connections,
    (SELECT COUNT(*)::bigint FROM tiktok_connections)::bigint as tiktok_connections,
    (SELECT COUNT(*)::bigint FROM linkedin_connections WHERE created_at >= NOW() - INTERVAL '24 hours')::bigint as recent_linkedin,
    (SELECT COUNT(*)::bigint FROM facebook_instagram_connections WHERE created_at >= NOW() - INTERVAL '24 hours')::bigint as recent_facebook,
    (SELECT COUNT(*)::bigint FROM tiktok_connections WHERE created_at >= NOW() - INTERVAL '24 hours')::bigint as recent_tiktok;
END;
$function$;

-- Fix get_admin_recent_activity function
CREATE OR REPLACE FUNCTION public.get_admin_recent_activity()
 RETURNS TABLE(recent_profiles json, recent_connections json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'email', email,
          'full_name', full_name,
          'user_type', user_type,
          'company_name', company_name,
          'created_at', created_at
        )
      )
      FROM profiles 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC 
      LIMIT 5
    )::json as recent_profiles,
    (
      SELECT json_agg(
        json_build_object(
          'platform', 'LinkedIn',
          'created_at', created_at,
          'user_id', user_id
        )
      )
      FROM linkedin_connections 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC 
      LIMIT 3
    )::json as recent_connections;
END;
$function$;

-- Fix get_user_subscription function
CREATE OR REPLACE FUNCTION public.get_user_subscription(user_id_param uuid)
 RETURNS TABLE(plan_name text, plan_slug text, limits jsonb, status text, current_period_end timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sp.name,
    sp.slug,
    sp.limits,
    us.status,
    us.current_period_end
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_id_param
  AND us.status = 'active'
  LIMIT 1;
  
  -- If no subscription found, return default (Starter)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      sp.name,
      sp.slug,
      sp.limits,
      'active'::TEXT,
      NULL::TIMESTAMPTZ
    FROM public.subscription_plans sp
    WHERE sp.slug = 'starter'
    LIMIT 1;
  END IF;
END;
$function$;

-- Fix handle_webhook_notification function
CREATE OR REPLACE FUNCTION public.handle_webhook_notification()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  payload_data JSON;
  webhook_data RECORD;
BEGIN
  -- Esta función se puede usar para procesar notificaciones si es necesario
  -- Por ahora es un placeholder para futuras implementaciones
  NULL;
END;
$function$;

-- Fix check_usage_limit function
CREATE OR REPLACE FUNCTION public.check_usage_limit(user_id_param uuid, usage_type_param text, limit_key_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_plan RECORD;
  current_usage INTEGER;
  plan_limit INTEGER;
BEGIN
  -- Get user's current plan
  SELECT * INTO user_plan FROM public.get_user_subscription(user_id_param);
  
  -- Get the limit for this usage type
  plan_limit := (user_plan.limits->limit_key_param)::INTEGER;
  
  -- If limit is -1, it means unlimited
  IF plan_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Get current month usage
  SELECT COALESCE(usage_count, 0) INTO current_usage
  FROM public.subscription_usage
  WHERE user_id = user_id_param 
    AND usage_type = usage_type_param
    AND period_start = date_trunc('month', now())
    AND period_end = date_trunc('month', now()) + interval '1 month';
  
  RETURN current_usage < plan_limit;
END;
$function$;