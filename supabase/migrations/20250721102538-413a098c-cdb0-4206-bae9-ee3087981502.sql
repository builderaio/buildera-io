-- Función para obtener analytics completos para administradores
CREATE OR REPLACE FUNCTION public.get_admin_analytics_data(
  start_date timestamp with time zone,
  end_date timestamp with time zone
)
RETURNS TABLE (
  metric_name text,
  metric_value numeric,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  platform text,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Función para obtener resumen de analytics para administradores
CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary(
  start_date timestamp with time zone,
  end_date timestamp with time zone
)
RETURNS TABLE (
  total_users bigint,
  total_companies bigint,
  total_developers bigint,
  total_experts bigint,
  total_linkedin_connections bigint,
  total_facebook_connections bigint,
  total_tiktok_connections bigint,
  total_ai_logs bigint,
  active_models bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Dar permisos de ejecución para usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_admin_analytics_data(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics_summary(timestamp with time zone, timestamp with time zone) TO authenticated;