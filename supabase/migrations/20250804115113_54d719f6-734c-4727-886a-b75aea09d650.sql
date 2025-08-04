-- Corregir el trigger handle_new_user para manejar correctamente los casos NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_type_value TEXT;
  auth_provider_value TEXT;
  is_social_signup BOOLEAN;
  computed_user_type user_type; -- Usar el tipo correcto desde el inicio
BEGIN
  -- Determinar el proveedor de autenticación
  auth_provider_value := COALESCE(
    (SELECT provider FROM auth.identities WHERE user_id = NEW.id AND provider != 'email' LIMIT 1),
    'email'
  );
  
  -- Determinar tipo de usuario desde metadata, por defecto 'company' para email
  user_type_value := COALESCE(NEW.raw_user_meta_data->>'user_type', 'company');
  
  -- LA LÓGICA PRINCIPAL: usar auth_provider para determinar si forzar complete-profile
  is_social_signup := (auth_provider_value != 'email');

  -- Calcular el user_type correctamente
  IF is_social_signup THEN
    computed_user_type := NULL; -- Forzar complete-profile para sociales
  ELSIF user_type_value IS NOT NULL AND user_type_value IN ('company', 'developer', 'expert') THEN
    computed_user_type := user_type_value::user_type; -- Cast seguro
  ELSE
    computed_user_type := 'company'::user_type; -- Default para email
  END IF;

  -- Log para debugging
  RAISE LOG 'Creando perfil para usuario %, auth_provider: %, user_type: %, is_social: %', 
    NEW.id, auth_provider_value, computed_user_type, is_social_signup;

  -- Insertar perfil básico del USUARIO (solo datos del usuario)
  INSERT INTO public.profiles (
    user_id,
    email,
    user_type,
    auth_provider,
    full_name,
    years_experience,
    country,
    location,
    linked_providers
  )
  VALUES (
    NEW.id,
    NEW.email,
    computed_user_type, -- Ya está como user_type correcto
    auth_provider_value,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CAST(COALESCE(NEW.raw_user_meta_data->>'years_experience', '0') AS INTEGER),
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'location',
    ARRAY[auth_provider_value]
  );

  RAISE LOG 'Perfil creado exitosamente para usuario %', NEW.id;

  -- Crear onboarding status
  INSERT INTO public.user_onboarding_status (
    user_id,
    registration_method
  ) VALUES (
    NEW.id,
    CASE 
      WHEN is_social_signup THEN 'social'
      ELSE 'email'
    END
  );

  RAISE LOG 'Onboarding status creado para usuario %', NEW.id;

  -- Solo crear EMPRESA para registros por EMAIL de tipo 'company'
  -- NO crear empresa para registros sociales (se creará en CompleteProfile)
  IF NOT is_social_signup AND computed_user_type = 'company' THEN
    DECLARE
      new_company_id UUID;
    BEGIN
      RAISE LOG 'Creando empresa para usuario % (registro por email)', NEW.id;
      
      -- Crear empresa con datos de empresa
      INSERT INTO public.companies (
        name, 
        description,
        website_url,
        industry_sector,
        company_size, 
        created_by
      ) VALUES (
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
        'Empresa creada durante el registro por email',
        NEW.raw_user_meta_data->>'website_url',
        NEW.raw_user_meta_data->>'industry_sector',
        NEW.raw_user_meta_data->>'company_size',
        NEW.id
      ) RETURNING id INTO new_company_id;

      RAISE LOG 'Empresa creada con ID % para usuario %', new_company_id, NEW.id;

      -- Agregar como miembro owner y empresa principal
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

      RAISE LOG 'Miembro de empresa creado para usuario %', NEW.id;

      -- Llamar webhook solo para registros de empresa por email (opcional)
      BEGIN
        PERFORM
          net.http_post(
            url := 'https://ubhzzppmkhxbuiajfswa.supabase.co/functions/v1/process-company-webhooks',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaHp6cHBta2h4YnVpYWpmc3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU4MjIsImV4cCI6MjA2NzM0MTgyMn0.zWscWKJSXVFREwlkkBC0gwMNHcUlFCpakf-RZWBZ2bQ'
            ),
            body := json_build_object(
              'user_id', NEW.id,
              'company_name', COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
              'website_url', NEW.raw_user_meta_data->>'website_url',
              'trigger_type', 'email_registration'
            )::text
          );
        RAISE LOG 'Webhook enviado para usuario %', NEW.id;
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error enviando webhook para usuario %: %', NEW.id, SQLERRM;
        -- No fallar el trigger si el webhook falla
      END;
    END;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error en trigger handle_new_user para usuario %: %', NEW.id, SQLERRM;
  -- Re-raise el error para que no se pierda
  RAISE;
END;
$$;