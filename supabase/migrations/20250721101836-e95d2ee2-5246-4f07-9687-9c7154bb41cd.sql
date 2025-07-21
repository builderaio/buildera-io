-- Crear función para que los administradores puedan ver todos los perfiles
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  user_type public.user_type,
  company_name text,
  website_url text,
  industry text,
  created_at timestamp with time zone,
  linked_providers text[],
  avatar_url text,
  user_position text,
  country text,
  location text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Esta función permite a los administradores ver todos los perfiles
  -- Sin restricciones de RLS
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.full_name,
    p.user_type,
    p.company_name,
    p.website_url,
    p.industry,
    p.created_at,
    p.linked_providers,
    p.avatar_url,
    p."position" as user_position, -- position es palabra reservada, usar comillas
    p.country,
    p.location
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Dar permisos de ejecución para usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_all_profiles_admin() TO authenticated;

-- Función adicional para obtener estadísticas de usuarios
CREATE OR REPLACE FUNCTION public.get_user_stats_admin()
RETURNS TABLE (
  total_users bigint,
  companies bigint,
  developers bigint,
  experts bigint,
  active_last_30_days bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_users,
    COUNT(*) FILTER (WHERE user_type = 'company')::bigint as companies,
    COUNT(*) FILTER (WHERE user_type = 'developer')::bigint as developers,
    COUNT(*) FILTER (WHERE user_type = 'expert')::bigint as experts,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::bigint as active_last_30_days
  FROM public.profiles;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_stats_admin() TO authenticated;