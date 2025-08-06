-- Recrear la función handle_new_user() para manejar user_type correctamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  extracted_user_type text;
  final_user_type public.user_type;
BEGIN
  -- Extraer user_type de raw_user_meta_data
  extracted_user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Si no hay user_type en metadatos, intentar inferir del contexto
  -- o establecer un valor por defecto basado en otros campos
  IF extracted_user_type IS NULL THEN
    -- Si hay company_name en metadatos, asumir que es 'company'
    IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
      extracted_user_type := 'company';
    -- Si hay github o skills, asumir que es 'developer'
    ELSIF NEW.raw_user_meta_data->>'github_url' IS NOT NULL OR NEW.raw_user_meta_data->>'skills' IS NOT NULL THEN
      extracted_user_type := 'developer';
    -- Si hay industry o expertise, asumir que es 'expert'
    ELSIF NEW.raw_user_meta_data->>'industry' IS NOT NULL OR NEW.raw_user_meta_data->>'expertise_areas' IS NOT NULL THEN
      extracted_user_type := 'expert';
    -- Por defecto, company si no se puede determinar
    ELSE
      extracted_user_type := 'company';
    END IF;
  END IF;
  
  -- Convertir a enum válido
  CASE extracted_user_type
    WHEN 'company' THEN final_user_type := 'company'::public.user_type;
    WHEN 'developer' THEN final_user_type := 'developer'::public.user_type;
    WHEN 'expert' THEN final_user_type := 'expert'::public.user_type;
    ELSE final_user_type := 'company'::public.user_type; -- fallback por defecto
  END CASE;

  -- Insertar el perfil del usuario con user_type garantizado
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
    final_user_type  -- user_type nunca será NULL ahora
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