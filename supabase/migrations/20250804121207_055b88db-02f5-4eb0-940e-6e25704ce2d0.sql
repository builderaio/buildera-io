-- Corregir el trigger handle_new_user para implementar la lógica simplificada
-- Solo crear empresa para usuarios de email, no para usuarios sociales

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = ''
AS $$
DECLARE
  is_social_signup BOOLEAN;
  provider_name TEXT;
BEGIN
  -- Detectar si es registro social
  -- Los registros sociales tienen email_confirmed_at ya establecido
  -- Los registros por email tienen email_confirmed_at = NULL inicialmente
  is_social_signup := NEW.email_confirmed_at IS NOT NULL AND NEW.confirmation_sent_at IS NULL;
  
  -- Determinar el proveedor
  IF is_social_signup THEN
    -- Para registros sociales, intentar extraer el proveedor de app_metadata
    provider_name := COALESCE(
      NEW.raw_app_meta_data->>'provider',
      NEW.raw_user_meta_data->>'iss',
      'social'
    );
    
    -- Si contiene google, facebook, etc., usar eso
    IF provider_name LIKE '%google%' THEN
      provider_name := 'google';
    ELSIF provider_name LIKE '%facebook%' THEN
      provider_name := 'facebook';
    ELSIF provider_name LIKE '%linkedin%' THEN
      provider_name := 'linkedin_oidc';
    END IF;
  ELSE
    provider_name := 'email';
  END IF;

  -- Crear perfil con lógica simplificada
  IF is_social_signup THEN
    -- REGISTRO SOCIAL: user_type = NULL (forzar complete-profile)
    INSERT INTO public.profiles (
      id, 
      user_id, 
      email, 
      full_name,
      user_type,           -- NULL para forzar complete-profile
      auth_provider,
      linked_providers
    ) VALUES (
      NEW.id,
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        CONCAT(
          NEW.raw_user_meta_data->>'first_name', 
          ' ', 
          NEW.raw_user_meta_data->>'last_name'
        )
      ),
      NULL,                -- user_type = NULL para usuarios sociales
      provider_name,
      ARRAY[provider_name]
    );
  ELSE
    -- REGISTRO POR EMAIL: user_type = 'company' por defecto
    INSERT INTO public.profiles (
      id, 
      user_id, 
      email, 
      full_name,
      user_type,
      auth_provider,
      linked_providers
    ) VALUES (
      NEW.id,
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name'
      ),
      'company',           -- user_type = 'company' para usuarios de email
      'email',
      ARRAY['email']
    );

    -- Solo crear empresa para registros por EMAIL con user_type = company
    -- (que es el caso por defecto)
    PERFORM public.create_company_with_owner(
      company_name := COALESCE(
        NEW.raw_user_meta_data->>'company_name',
        'Mi Empresa'
      ),
      company_description := NEW.raw_user_meta_data->>'company_description',
      website_url := NEW.raw_user_meta_data->>'website_url',
      industry_sector := NEW.raw_user_meta_data->>'industry',
      company_size := NEW.raw_user_meta_data->>'company_size',
      user_id_param := NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;