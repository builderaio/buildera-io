-- Crear directamente el usuario desarrollador
-- Primero necesitamos crear un trigger que maneje la creación de perfiles de desarrollador

CREATE OR REPLACE FUNCTION public.create_developer_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Si el usuario es de tipo developer, crear su perfil de desarrollador
  IF NEW.raw_user_meta_data->>'user_type' = 'developer' THEN
    INSERT INTO public.developer_profiles (
      user_id,
      developer_name,
      company_name,
      tier,
      skills,
      experience_years,
      github_url,
      total_agents_created,
      total_deployments,
      total_revenue
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      'Freelance Developer',
      'free',
      CASE 
        WHEN NEW.raw_user_meta_data->>'skills' IS NOT NULL 
        THEN string_to_array(NEW.raw_user_meta_data->>'skills', ',')
        ELSE ARRAY[]::text[]
      END,
      COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
      NEW.raw_user_meta_data->>'github_url',
      0,
      0,
      0
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS on_auth_user_created_developer ON auth.users;
CREATE TRIGGER on_auth_user_created_developer
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_developer_profile_for_new_user();