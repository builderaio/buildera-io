-- Crear función para inicializar el estado de onboarding cuando se crea un perfil
CREATE OR REPLACE FUNCTION public.create_user_onboarding_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
BEGIN
  -- Crear registro inicial de onboarding para el nuevo usuario
  INSERT INTO public.user_onboarding_status (
    user_id,
    dna_empresarial_completed,
    first_login_completed,
    onboarding_started_at,
    registration_method
  )
  VALUES (
    NEW.user_id,
    false,
    false,
    now(),
    NEW.auth_provider
  );
  
  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecute después de insertar un nuevo perfil
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_user_onboarding_status();