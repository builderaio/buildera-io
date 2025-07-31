-- Actualizar la función para manejar el contexto del trigger
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  company_name TEXT,
  company_description TEXT DEFAULT NULL,
  website_url TEXT DEFAULT NULL,
  industry_sector TEXT DEFAULT NULL,
  company_size TEXT DEFAULT NULL,
  user_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_company_id UUID;
  current_user_id UUID;
BEGIN
  -- Usar el parámetro si se proporciona, sino usar auth.uid()
  current_user_id := COALESCE(user_id_param, auth.uid());
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Crear la empresa
  INSERT INTO public.companies (
    name, description, website_url, industry_sector, company_size, created_by
  ) VALUES (
    company_name, company_description, website_url, industry_sector, company_size, current_user_id
  ) RETURNING id INTO new_company_id;
  
  -- Asignar al usuario como owner y empresa principal
  INSERT INTO public.company_members (
    user_id, company_id, role, is_primary
  ) VALUES (
    current_user_id, new_company_id, 'owner', true
  );
  
  RETURN new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Actualizar el trigger para pasar el user_id explícitamente
CREATE OR REPLACE FUNCTION public.handle_new_company_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Si es un usuario tipo company, crear la empresa automáticamente
  IF NEW.raw_user_meta_data->>'user_type' = 'company' THEN
    SELECT public.create_company_with_owner(
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
      NULL,
      NEW.raw_user_meta_data->>'website_url',
      NEW.raw_user_meta_data->>'industry_sector',
      NEW.raw_user_meta_data->>'company_size',
      NEW.id  -- Pasar explícitamente el ID del nuevo usuario
    ) INTO new_company_id;
    
    -- Actualizar el perfil con la empresa principal
    UPDATE public.profiles 
    SET primary_company_id = new_company_id 
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';