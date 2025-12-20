-- Fix: Sync primary_company_id for existing users who have company_members but NULL primary_company_id
UPDATE public.profiles p
SET primary_company_id = cm.company_id
FROM public.company_members cm
WHERE cm.user_id = p.user_id
  AND cm.is_primary = true
  AND p.primary_company_id IS NULL;

-- Also update the create_company_with_owner function to ensure primary_company_id is set
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  company_name text, 
  company_description text DEFAULT NULL::text, 
  website_url text DEFAULT NULL::text, 
  industry_sector text DEFAULT NULL::text, 
  company_size text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_company_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
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
  
  -- Sync primary_company_id in profiles
  UPDATE public.profiles 
  SET primary_company_id = new_company_id 
  WHERE user_id = current_user_id;
  
  RETURN new_company_id;
END;
$function$;