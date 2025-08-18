-- Agregar campos para manejar estado activo/inactivo en usuarios y empresas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deactivated_by UUID DEFAULT NULL;

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deactivated_by UUID DEFAULT NULL;

-- Función para inactivar un usuario
CREATE OR REPLACE FUNCTION public.deactivate_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo permitir a administradores
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden inactivar usuarios';
  END IF;
  
  -- Inactivar el perfil
  UPDATE public.profiles 
  SET 
    is_active = false,
    deactivated_at = now(),
    deactivated_by = auth.uid()
  WHERE user_id = target_user_id;
  
  -- Inactivar todas las membresías de empresas
  UPDATE public.company_members 
  SET 
    role = 'inactive',
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$function$;

-- Función para reactivar un usuario  
CREATE OR REPLACE FUNCTION public.reactivate_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo permitir a administradores
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden reactivar usuarios';
  END IF;
  
  -- Reactivar el perfil
  UPDATE public.profiles 
  SET 
    is_active = true,
    deactivated_at = NULL,
    deactivated_by = NULL
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$function$;

-- Función para inactivar una empresa
CREATE OR REPLACE FUNCTION public.deactivate_company(target_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo permitir a administradores
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden inactivar empresas';
  END IF;
  
  -- Inactivar la empresa
  UPDATE public.companies 
  SET 
    is_active = false,
    deactivated_at = now(),
    deactivated_by = auth.uid()
  WHERE id = target_company_id;
  
  -- Inactivar los agentes de la empresa
  UPDATE public.company_agents 
  SET is_active = false
  WHERE company_id = target_company_id;
  
  RETURN true;
END;
$function$;

-- Función para reactivar una empresa
CREATE OR REPLACE FUNCTION public.reactivate_company(target_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo permitir a administradores
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden reactivar empresas';
  END IF;
  
  -- Reactivar la empresa
  UPDATE public.companies 
  SET 
    is_active = true,
    deactivated_at = NULL,
    deactivated_by = NULL
  WHERE id = target_company_id;
  
  RETURN true;
END;
$function$;