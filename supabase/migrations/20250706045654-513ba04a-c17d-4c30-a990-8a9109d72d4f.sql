-- Verificar si el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Recrear el trigger y función si es necesario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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
    industry_sector,
    website_url
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
    NEW.raw_user_meta_data->>'industry_sector',
    NEW.raw_user_meta_data->>'website_url'
  );
  RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();