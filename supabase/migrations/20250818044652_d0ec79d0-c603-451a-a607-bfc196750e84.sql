-- Corregir la función de trigger para crear el perfil con el tipo correcto
CREATE OR REPLACE FUNCTION public.create_public_profile_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, user_type, auth_provider)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'user_type')::public.user_type, -- Usar el tipo correcto
    new.raw_app_meta_data->>'provider'
  );
  RETURN new;
END;
$function$;