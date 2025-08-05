-- Actualizar el trigger handle_new_user para establecer user_type desde user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER set search_path = ''
AS $$
BEGIN
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
  RETURN NEW;
END;
$$;