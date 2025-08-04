-- Corregir handle_new_user para separar correctamente datos de usuario (profiles) y empresa (companies)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_type_value TEXT;
  is_social_signup BOOLEAN;
BEGIN
  -- Determinar tipo de usuario
  user_type_value := NEW.raw_user_meta_data->>'user_type';
  
  -- Verificar si es registro social (no tiene user_type o proviene de OAuth)
  is_social_signup := (user_type_value IS NULL OR 
                       EXISTS (SELECT 1 FROM auth.identities WHERE user_id = NEW.id AND provider != 'email'));

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
    -- Para registro social, user_type debe ser NULL para forzar complete-profile
    CASE 
      WHEN is_social_signup THEN NULL
      ELSE user_type_value::user_type
    END,
    COALESCE(
      (SELECT provider FROM auth.identities WHERE user_id = NEW.id AND provider != 'email' LIMIT 1),
      'email'
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CAST(COALESCE(NEW.raw_user_meta_data->>'years_experience', '0') AS INTEGER),
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'location',
    ARRAY[COALESCE(
      (SELECT provider FROM auth.identities WHERE user_id = NEW.id AND provider != 'email' LIMIT 1),
      'email'
    )]
  );

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

  -- Solo crear EMPRESA para registros por EMAIL de tipo 'company'
  -- NO crear empresa para registros sociales (se creará en CompleteProfile)
  IF NOT is_social_signup AND user_type_value = 'company' THEN
    DECLARE
      new_company_id UUID;
    BEGIN
      -- Crear empresa con datos de empresa
      INSERT INTO public.companies (
        name, 
        description,
        website_url,
        industry_sector,
        company_size, 
        created_by
      ) VALUES (
        NEW.raw_user_meta_data->>'company_name',
        'Empresa creada durante el registro por email',
        NEW.raw_user_meta_data->>'website_url',
        NEW.raw_user_meta_data->>'industry_sector',
        NEW.raw_user_meta_data->>'company_size',
        NEW.id
      ) RETURNING id INTO new_company_id;

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

      -- Llamar webhook solo para registros de empresa por email
      PERFORM
        net.http_post(
          url := 'https://ubhzzppmkhxbuiajfswa.supabase.co/functions/v1/process-company-webhooks',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaHp6cHBta2h4YnVpYWpmc3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU4MjIsImV4cCI6MjA2NzM0MTgyMn0.zWscWKJSXVFREwlkkBC0gwMNHcUlFCpakf-RZWBZ2bQ'
          ),
          body := json_build_object(
            'user_id', NEW.id,
            'company_name', NEW.raw_user_meta_data->>'company_name',
            'website_url', NEW.raw_user_meta_data->>'website_url',
            'trigger_type', 'email_registration'
          )::text
        );
    END;
  END IF;

  RETURN NEW;
END;
$$;