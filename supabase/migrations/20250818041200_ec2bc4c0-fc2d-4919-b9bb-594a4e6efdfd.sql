-- Corregir la función get_all_profiles_admin para incluir información completa de empresas y onboarding
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  email text, 
  full_name text, 
  user_type user_type, 
  company_name text, 
  website_url text, 
  industry text, 
  created_at timestamp with time zone, 
  linked_providers text[], 
  avatar_url text, 
  user_position text, 
  country text, 
  location text,
  company_role text,
  is_primary_company boolean,
  company_id uuid,
  onboarding_completed boolean,
  onboarding_completed_at timestamp with time zone,
  registration_method text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.full_name,
    p.user_type,
    c.name as company_name,
    c.website_url,
    c.industry_sector as industry,
    p.created_at,
    p.linked_providers,
    p.avatar_url,
    p."position" as user_position,
    p.country,
    p.location,
    cm.role as company_role,
    cm.is_primary as is_primary_company,
    c.id as company_id,
    COALESCE(uo.dna_empresarial_completed, false) as onboarding_completed,
    uo.onboarding_completed_at,
    uo.registration_method
  FROM public.profiles p
  LEFT JOIN public.company_members cm ON p.user_id = cm.user_id AND cm.is_primary = true
  LEFT JOIN public.companies c ON cm.company_id = c.id
  LEFT JOIN public.user_onboarding_status uo ON p.user_id = uo.user_id
  ORDER BY p.created_at DESC;
END;
$function$