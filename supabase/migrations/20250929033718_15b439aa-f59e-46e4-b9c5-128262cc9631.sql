-- Corregir el trigger para perfiles de desarrollador
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
      github_url,
      specialties,
      tier,
      total_agents_created,
      total_deployments,
      total_revenue
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      'Freelance Developer',
      NEW.raw_user_meta_data->>'github_url',
      CASE 
        WHEN NEW.raw_user_meta_data->>'skills' IS NOT NULL 
        THEN string_to_array(NEW.raw_user_meta_data->>'skills', ',')
        ELSE ARRAY[]::text[]
      END,
      'free',
      0,
      0,
      0
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;