-- Corregir la función get_admin_recent_activity para evitar el error de GROUP BY
CREATE OR REPLACE FUNCTION public.get_admin_recent_activity()
RETURNS TABLE(
  recent_profiles json, 
  recent_connections json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    -- Perfiles recientes (últimos 5)
    (SELECT json_agg(
      json_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'user_type', p.user_type,
        'created_at', p.created_at
      )
    ) FROM (
      SELECT p.id, p.email, p.full_name, p.user_type, p.created_at 
      FROM profiles p 
      ORDER BY p.created_at DESC 
      LIMIT 5
    ) p) as recent_profiles,
    
    -- Conexiones recientes 
    (SELECT json_build_object(
      'linkedin', (SELECT COUNT(*) FROM linkedin_connections WHERE created_at >= NOW() - INTERVAL '24 hours'),
      'facebook', (SELECT COUNT(*) FROM facebook_instagram_connections WHERE created_at >= NOW() - INTERVAL '24 hours'),
      'tiktok', (SELECT COUNT(*) FROM tiktok_connections WHERE created_at >= NOW() - INTERVAL '24 hours')
    )) as recent_connections;
END;
$function$