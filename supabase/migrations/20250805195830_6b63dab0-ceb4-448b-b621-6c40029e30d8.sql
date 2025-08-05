-- Fix the final remaining search_path security issues

-- Fix increment_usage function
CREATE OR REPLACE FUNCTION public.increment_usage(user_id_param uuid, usage_type_param text, increment_by integer DEFAULT 1)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  period_start TIMESTAMPTZ;
  period_end TIMESTAMPTZ;
BEGIN
  period_start := date_trunc('month', now());
  period_end := period_start + interval '1 month';
  
  INSERT INTO public.subscription_usage (user_id, usage_type, usage_count, period_start, period_end)
  VALUES (user_id_param, usage_type_param, increment_by, period_start, period_end)
  ON CONFLICT (user_id, usage_type, period_start)
  DO UPDATE SET 
    usage_count = subscription_usage.usage_count + increment_by,
    updated_at = now();
END;
$function$;

-- Fix mark_onboarding_completed function
CREATE OR REPLACE FUNCTION public.mark_onboarding_completed(_user_id uuid, _registration_method text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_onboarding_status (
    user_id,
    dna_empresarial_completed,
    first_login_completed,
    registration_method,
    onboarding_completed_at
  )
  VALUES (
    _user_id,
    TRUE,
    TRUE,
    _registration_method,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    dna_empresarial_completed = TRUE,
    onboarding_completed_at = now(),
    registration_method = COALESCE(EXCLUDED.registration_method, user_onboarding_status.registration_method),
    updated_at = now();
END;
$function$;

-- Fix get_admin_analytics_data function
CREATE OR REPLACE FUNCTION public.get_admin_analytics_data(start_date timestamp with time zone, end_date timestamp with time zone)
 RETURNS TABLE(metric_name text, metric_value numeric, period_start timestamp with time zone, period_end timestamp with time zone, platform text, metadata jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Retornar datos reales de system_analytics y datos calculados
  RETURN QUERY
  SELECT 
    sa.metric_name,
    sa.metric_value,
    sa.period_start,
    sa.period_end,
    sa.platform,
    sa.metadata
  FROM system_analytics sa
  WHERE sa.period_start >= start_date 
    AND sa.period_start <= end_date
  
  UNION ALL
  
  -- Agregar métricas calculadas de registros de usuarios
  SELECT 
    'daily_user_registrations'::text as metric_name,
    COUNT(*)::numeric as metric_value,
    DATE_TRUNC('day', p.created_at) as period_start,
    DATE_TRUNC('day', p.created_at) + INTERVAL '1 day' as period_end,
    'all'::text as platform,
    json_build_object(
      'companies', COUNT(*) FILTER (WHERE p.user_type = 'company'),
      'developers', COUNT(*) FILTER (WHERE p.user_type = 'developer'),
      'experts', COUNT(*) FILTER (WHERE p.user_type = 'expert')
    )::jsonb as metadata
  FROM profiles p
  WHERE p.created_at >= start_date 
    AND p.created_at <= end_date
  GROUP BY DATE_TRUNC('day', p.created_at)
  
  UNION ALL
  
  -- Agregar métricas de conexiones LinkedIn
  SELECT 
    'daily_linkedin_connections'::text as metric_name,
    COUNT(*)::numeric as metric_value,
    DATE_TRUNC('day', lc.created_at) as period_start,
    DATE_TRUNC('day', lc.created_at) + INTERVAL '1 day' as period_end,
    'linkedin'::text as platform,
    '{}'::jsonb as metadata
  FROM linkedin_connections lc
  WHERE lc.created_at >= start_date 
    AND lc.created_at <= end_date
  GROUP BY DATE_TRUNC('day', lc.created_at)
  
  UNION ALL
  
  -- Agregar métricas de conexiones Facebook
  SELECT 
    'daily_facebook_connections'::text as metric_name,
    COUNT(*)::numeric as metric_value,
    DATE_TRUNC('day', fc.created_at) as period_start,
    DATE_TRUNC('day', fc.created_at) + INTERVAL '1 day' as period_end,
    'facebook'::text as platform,
    '{}'::jsonb as metadata
  FROM facebook_instagram_connections fc
  WHERE fc.created_at >= start_date 
    AND fc.created_at <= end_date
  GROUP BY DATE_TRUNC('day', fc.created_at)
  
  UNION ALL
  
  -- Agregar métricas de conexiones TikTok
  SELECT 
    'daily_tiktok_connections'::text as metric_name,
    COUNT(*)::numeric as metric_value,
    DATE_TRUNC('day', tc.created_at) as period_start,
    DATE_TRUNC('day', tc.created_at) + INTERVAL '1 day' as period_end,
    'tiktok'::text as platform,
    '{}'::jsonb as metadata
  FROM tiktok_connections tc
  WHERE tc.created_at >= start_date 
    AND tc.created_at <= end_date
  GROUP BY DATE_TRUNC('day', tc.created_at)
  
  ORDER BY period_start DESC;
END;
$function$;

-- Fix calculate_engagement_rate function
CREATE OR REPLACE FUNCTION public.calculate_engagement_rate(likes integer, comments integer, followers integer)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF followers = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(((likes + comments)::NUMERIC / followers::NUMERIC) * 100, 2);
END;
$function$;

-- Fix extract_hashtags function
CREATE OR REPLACE FUNCTION public.extract_hashtags(caption text)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  hashtags TEXT[];
BEGIN
  IF caption IS NULL THEN
    RETURN '{}';
  END IF;
  
  SELECT array_agg(DISTINCT LOWER(hashtag))
  INTO hashtags
  FROM (
    SELECT regexp_replace(unnest(regexp_split_to_array(caption, '#')), '^([a-zA-Z0-9_]+).*', '\1') as hashtag
  ) t
  WHERE hashtag != '' AND hashtag != caption;
  
  RETURN COALESCE(hashtags, '{}');
END;
$function$;

-- Fix extract_mentions function
CREATE OR REPLACE FUNCTION public.extract_mentions(caption text)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  mentions TEXT[];
BEGIN
  IF caption IS NULL THEN
    RETURN '{}';
  END IF;
  
  SELECT array_agg(DISTINCT LOWER(mention))
  INTO mentions
  FROM (
    SELECT regexp_replace(unnest(regexp_split_to_array(caption, '@')), '^([a-zA-Z0-9_.]+).*', '\1') as mention
  ) t
  WHERE mention != '' AND mention != caption;
  
  RETURN COALESCE(mentions, '{}');
END;
$function$;

-- Fix update_user_gamification function  
CREATE OR REPLACE FUNCTION public.update_user_gamification(p_user_id uuid, p_points_earned integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
DECLARE
  current_points INTEGER;
  new_level INTEGER;
BEGIN
  -- Insert o update gamification data
  INSERT INTO public.user_gamification (user_id, total_points, experience_points, last_activity)
  VALUES (p_user_id, p_points_earned, p_points_earned, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = user_gamification.total_points + p_points_earned,
    experience_points = user_gamification.experience_points + p_points_earned,
    last_activity = now(),
    updated_at = now();
  
  -- Calcular nuevo nivel
  SELECT total_points INTO current_points 
  FROM public.user_gamification 
  WHERE user_id = p_user_id;
  
  new_level := public.calculate_user_level(current_points);
  
  -- Actualizar nivel
  UPDATE public.user_gamification 
  SET level = new_level 
  WHERE user_id = p_user_id;
END;
$function$;

-- Fix get_user_primary_company_data function
CREATE OR REPLACE FUNCTION public.get_user_primary_company_data(user_id_param uuid)
 RETURNS TABLE(company_id uuid, company_name text, description text, website_url text, industry_sector text, company_size text, country text, location text, logo_url text, primary_color text, secondary_color text, facebook_url text, twitter_url text, linkedin_url text, instagram_url text, youtube_url text, tiktok_url text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.website_url,
    c.industry_sector,
    c.company_size,
    c.country,
    c.location,
    c.logo_url,
    c.primary_color,
    c.secondary_color,
    c.facebook_url,
    c.twitter_url,
    c.linkedin_url,
    c.instagram_url,
    c.youtube_url,
    c.tiktok_url,
    c.created_at,
    c.updated_at
  FROM public.companies c
  JOIN public.company_members cm ON cm.company_id = c.id
  WHERE cm.user_id = user_id_param 
    AND cm.is_primary = true
  LIMIT 1;
END;
$function$;

-- Fix get_admin_analytics_summary function
CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary(start_date timestamp with time zone, end_date timestamp with time zone)
 RETURNS TABLE(total_users bigint, total_companies bigint, total_developers bigint, total_experts bigint, total_linkedin_connections bigint, total_facebook_connections bigint, total_tiktok_connections bigint, total_ai_logs bigint, active_models bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles WHERE created_at >= start_date AND created_at <= end_date)::bigint as total_users,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'company' AND created_at >= start_date AND created_at <= end_date)::bigint as total_companies,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'developer' AND created_at >= start_date AND created_at <= end_date)::bigint as total_developers,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'expert' AND created_at >= start_date AND created_at <= end_date)::bigint as total_experts,
    (SELECT COUNT(*) FROM linkedin_connections WHERE created_at >= start_date AND created_at <= end_date)::bigint as total_linkedin_connections,
    (SELECT COUNT(*) FROM facebook_instagram_connections WHERE created_at >= start_date AND created_at <= end_date)::bigint as total_facebook_connections,
    (SELECT COUNT(*) FROM tiktok_connections WHERE created_at >= start_date AND created_at <= end_date)::bigint as total_tiktok_connections,
    (SELECT COUNT(*) FROM ai_model_status_logs WHERE created_at >= start_date AND created_at <= end_date)::bigint as total_ai_logs,
    (SELECT COUNT(DISTINCT name) FROM ai_model_status_logs WHERE created_at >= start_date AND created_at <= end_date)::bigint as active_models;
END;
$function$;