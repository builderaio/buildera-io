-- Modificar el trigger handle_new_user para NO completar automáticamente el user_type en registros sociales
-- Esto permitirá que los usuarios sean dirigidos a CompleteProfile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  registration_method TEXT;
  final_user_type public.user_type;
BEGIN
  -- Detectar el método de registro
  registration_method := COALESCE(NEW.raw_user_meta_data->>'provider', 'email');
  
  -- Para registros sociales, NO establecer user_type automáticamente
  -- Esto forzará al usuario a completar su perfil en CompleteProfile
  IF registration_method != 'email' THEN
    final_user_type := NULL; -- Esto forzará al usuario a ir a CompleteProfile
  ELSE
    -- Para registros por email, usar el user_type proporcionado o company por defecto
    final_user_type := CAST(COALESCE(NEW.raw_user_meta_data->>'user_type', 'company') AS public.user_type);
  END IF;
  
  -- IMPORTANTE: Solo insertar campos que REALMENTE EXISTEN en la tabla profiles
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    user_type,
    github_url,
    skills,
    experience_years,
    expertise_areas,
    years_experience,
    industry_sector,
    country
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuario'),
    final_user_type, -- Puede ser NULL para registros sociales
    NEW.raw_user_meta_data->>'github_url',
    CASE 
      WHEN NEW.raw_user_meta_data->>'skills' IS NOT NULL 
      THEN string_to_array(NEW.raw_user_meta_data->>'skills', ',')
      ELSE NULL
    END,
    CAST(COALESCE(NEW.raw_user_meta_data->>'experience_years', '0') AS INTEGER),
    CASE 
      WHEN NEW.raw_user_meta_data->>'expertise_areas' IS NOT NULL 
      THEN string_to_array(NEW.raw_user_meta_data->>'expertise_areas', ',')
      ELSE NULL
    END,
    CAST(COALESCE(NEW.raw_user_meta_data->>'years_experience', '0') AS INTEGER),
    NEW.raw_user_meta_data->>'industry_sector',
    NEW.raw_user_meta_data->>'country'
  );
  
  -- Crear registro de onboarding status automáticamente
  INSERT INTO public.user_onboarding_status (
    user_id,
    registration_method,
    dna_empresarial_completed,
    first_login_completed,
    marketing_hub_visited
  )
  VALUES (
    NEW.id,
    registration_method,
    FALSE,
    FALSE,
    FALSE
  );
  
  -- SOLO crear empresa automáticamente para registros por EMAIL con user_type company
  -- Para registros sociales, la empresa se creará después de completar el perfil
  IF registration_method = 'email' 
     AND final_user_type = 'company' THEN
    
    -- Crear la empresa automáticamente con los campos correctos
    INSERT INTO public.companies (
      name, 
      description, 
      website_url, 
      industry_sector, 
      company_size, 
      created_by
    ) VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
      'Empresa creada automáticamente durante el registro',
      NEW.raw_user_meta_data->>'website_url',
      NEW.raw_user_meta_data->>'industry_sector',
      NEW.raw_user_meta_data->>'company_size',
      NEW.id
    ) RETURNING id INTO new_company_id;
    
    -- Asignar al usuario como owner y empresa principal
    INSERT INTO public.company_members (
      user_id, 
      company_id, 
      role, 
      is_primary
    ) VALUES (
      NEW.id, 
      new_company_id, 
      'owner', 
      true
    );
    
    -- Actualizar el perfil con la empresa principal
    UPDATE public.profiles 
    SET primary_company_id = new_company_id 
    WHERE user_id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;