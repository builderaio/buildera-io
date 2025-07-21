-- Función para obtener todos los datos de usuarios para analytics del admin
CREATE OR REPLACE FUNCTION public.get_admin_user_analytics()
RETURNS TABLE (
  total_users bigint,
  recent_users bigint,
  companies bigint,
  developers bigint,
  experts bigint,
  users_with_linkedin bigint,
  users_with_facebook bigint,
  users_with_tiktok bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Función para obtener conexiones sociales para analytics
CREATE OR REPLACE FUNCTION public.get_admin_social_connections()
RETURNS TABLE (
  linkedin_connections bigint,
  facebook_connections bigint,
  tiktok_connections bigint,
  recent_linkedin bigint,
  recent_facebook bigint,
  recent_tiktok bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Función para obtener registros recientes para el dashboard
CREATE OR REPLACE FUNCTION public.get_admin_recent_activity()
RETURNS TABLE (
  recent_profiles json,
  recent_connections json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Dar permisos de ejecución para usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_admin_user_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_social_connections() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_recent_activity() TO authenticated;