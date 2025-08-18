-- Corregir el trigger para usar todos los datos del formulario de registro
CREATE OR REPLACE FUNCTION public.create_company_for_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  company_id uuid;
  user_name text;
  company_name text;
  website_url text;
  industry_sector text;
  company_size text;
  country text;
BEGIN
  -- Revisa si el tipo de usuario en el nuevo perfil es 'company'
  IF new.user_type = 'company' THEN
    user_name := new.full_name;
    IF user_name IS NULL OR user_name = '' THEN
      user_name := 'Usuario';
    END IF;

    -- Obtener datos del registro desde raw_user_meta_data del usuario
    SELECT 
      COALESCE(u.raw_user_meta_data->>'company_name', 'El Negocio de ' || user_name),
      u.raw_user_meta_data->>'website_url',
      u.raw_user_meta_data->>'industry_sector',
      u.raw_user_meta_data->>'company_size',
      u.raw_user_meta_data->>'country'
    INTO company_name, website_url, industry_sector, company_size, country
    FROM auth.users u
    WHERE u.id = new.user_id;

    -- Inserta la nueva empresa con todos los datos del formulario
    INSERT INTO public.companies (
      name, 
      website_url, 
      industry_sector, 
      company_size, 
      country, 
      created_by
    )
    VALUES (
      company_name, 
      website_url, 
      industry_sector, 
      company_size, 
      country, 
      new.user_id
    )
    RETURNING id INTO company_id;

    -- Añade al usuario como miembro principal de la empresa
    INSERT INTO public.company_members (company_id, user_id, role, is_primary)
    VALUES (company_id, new.user_id, 'owner', true);

    -- Actualiza el perfil con el ID de la empresa primaria
    UPDATE public.profiles
    SET primary_company_id = company_id
    WHERE user_id = new.user_id;

  END IF;
  
  RETURN new;
END;
$function$;