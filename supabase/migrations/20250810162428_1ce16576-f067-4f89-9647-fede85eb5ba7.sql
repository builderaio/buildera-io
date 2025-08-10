-- 1) Actualizar función de creación de perfil sin website_url en profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    user_type,
    github_url,
    skills,
    experience_years,
    industry,
    expertise_areas,
    years_experience,
    company_name,
    company_size,
    industry_sector
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CAST(COALESCE(NEW.raw_user_meta_data->>'user_type', 'company') AS public.user_type),
    NEW.raw_user_meta_data->>'github_url',
    CASE 
      WHEN NEW.raw_user_meta_data->>'skills' IS NOT NULL 
      THEN string_to_array(NEW.raw_user_meta_data->>'skills', ',')
      ELSE NULL
    END,
    CAST(COALESCE(NEW.raw_user_meta_data->>'experience_years', '0') AS INTEGER),
    NEW.raw_user_meta_data->>'industry',
    CASE 
      WHEN NEW.raw_user_meta_data->>'expertise_areas' IS NOT NULL 
      THEN string_to_array(NEW.raw_user_meta_data->>'expertise_areas', ',')
      ELSE NULL
    END,
    CAST(COALESCE(NEW.raw_user_meta_data->>'years_experience', '0') AS INTEGER),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'company_size',
    NEW.raw_user_meta_data->>'industry_sector'
  );
  RETURN NEW;
END;
$$;

-- Asegurar que el trigger usa la versión actualizada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Actualizar función admin para no referenciar p.website_url (mantener firma; devolver NULL)
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  user_type public.user_type,
  company_name text,
  website_url text,
  industry text,
  created_at timestamptz,
  linked_providers text[],
  avatar_url text,
  user_position text,
  country text,
  location text
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
    p.company_name,
    NULL::text as website_url,
    p.industry,
    p.created_at,
    p.linked_providers,
    p.avatar_url,
    p."position" as user_position,
    p.country,
    p.location
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$function$;