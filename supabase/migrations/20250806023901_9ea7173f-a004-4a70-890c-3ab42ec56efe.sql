-- Create the user_type enum that's missing
CREATE TYPE user_type AS ENUM ('company', 'developer', 'expert');

-- Also need to check if the trigger function exists and fix it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Crear el perfil del usuario
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    auth_provider, 
    linked_providers,
    user_type
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM auth.identities 
        WHERE user_id = NEW.id 
        AND provider != 'email'
      ) THEN (
        SELECT provider FROM auth.identities 
        WHERE user_id = NEW.id 
        AND provider != 'email'
        LIMIT 1
      )
      ELSE 'email'
    END,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM auth.identities 
        WHERE user_id = NEW.id 
        AND provider != 'email'
      ) THEN ARRAY[(
        SELECT provider FROM auth.identities 
        WHERE user_id = NEW.id 
        AND provider != 'email'
        LIMIT 1
      )]
      ELSE ARRAY['email']
    END,
    -- Establecer user_type desde user_metadata si existe
    COALESCE(NEW.raw_user_meta_data->>'user_type', NULL)::user_type
  );

  -- Crear el estado de onboarding del usuario
  INSERT INTO public.user_onboarding_status (
    user_id,
    registration_method,
    onboarding_started_at
  )
  VALUES (
    NEW.id,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM auth.identities 
        WHERE user_id = NEW.id 
        AND provider != 'email'
      ) THEN 'social'
      ELSE 'email'
    END,
    now()
  );

  RETURN NEW;
END;
$$;