-- Actualizar el trigger handle_new_user para remover la referencia a la columna 'industry'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  registration_method TEXT;
BEGIN
  -- Detectar el método de registro
  registration_method := COALESCE(NEW.raw_user_meta_data->>'provider', 'email');
  
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
    company_size,
    industry_sector,
    website_url,
    country
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuario'),
    CAST(COALESCE(NEW.raw_user_meta_data->>'user_type', 'company') AS public.user_type),
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
    NEW.raw_user_meta_data->>'company_size',
    NEW.raw_user_meta_data->>'industry_sector',
    NEW.raw_user_meta_data->>'website_url',
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
  
  -- CRÍTICO: Para usuarios de registro social (no email), crear automáticamente la empresa
  -- Esto previene el loop infinito entre CompleteProfile y CompanyDashboard
  IF registration_method != 'email' 
     AND COALESCE(NEW.raw_user_meta_data->>'user_type', 'company') = 'company' THEN
    
    -- Crear la empresa automáticamente
    INSERT INTO public.companies (
      name, 
      description, 
      website_url, 
      industry_sector, 
      company_size, 
      created_by
    ) VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
      'Empresa creada automáticamente durante el registro social',
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