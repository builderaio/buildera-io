-- Arreglar la función handle_new_user para detectar correctamente registros sociales
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  is_social_signup BOOLEAN;
  provider_name TEXT;
BEGIN
  -- Detectar si es registro social de forma más robusta
  -- 1. Verificar si hay identidades OAuth
  is_social_signup := EXISTS (
    SELECT 1 FROM auth.identities 
    WHERE user_id = NEW.id 
    AND provider != 'email'
  );
  
  -- 2. Si no hay identidades OAuth, verificar metadatos
  IF NOT is_social_signup THEN
    is_social_signup := (
      NEW.raw_app_meta_data->>'provider' IS NOT NULL 
      AND NEW.raw_app_meta_data->>'provider' != 'email'
    ) OR (
      NEW.raw_user_meta_data->>'iss' IS NOT NULL
      AND NEW.raw_user_meta_data->>'iss' LIKE '%google%'
    ) OR (
      NEW.email_confirmed_at IS NOT NULL 
      AND NEW.confirmation_sent_at IS NULL
      AND NEW.raw_app_meta_data IS NOT NULL
    );
  END IF;

  -- Determinar el proveedor
  IF is_social_signup THEN
    -- Para registros sociales, intentar extraer el proveedor
    IF EXISTS (SELECT 1 FROM auth.identities WHERE user_id = NEW.id AND provider = 'google') THEN
      provider_name := 'google';
    ELSIF EXISTS (SELECT 1 FROM auth.identities WHERE user_id = NEW.id AND provider = 'facebook') THEN
      provider_name := 'facebook';
    ELSIF EXISTS (SELECT 1 FROM auth.identities WHERE user_id = NEW.id AND provider = 'linkedin_oidc') THEN
      provider_name := 'linkedin_oidc';
    ELSE
      -- Fallback a metadatos
      provider_name := COALESCE(
        NEW.raw_app_meta_data->>'provider',
        CASE 
          WHEN NEW.raw_user_meta_data->>'iss' LIKE '%google%' THEN 'google'
          WHEN NEW.raw_user_meta_data->>'iss' LIKE '%facebook%' THEN 'facebook'
          WHEN NEW.raw_user_meta_data->>'iss' LIKE '%linkedin%' THEN 'linkedin_oidc'
          ELSE 'social'
        END
      );
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
$function$;