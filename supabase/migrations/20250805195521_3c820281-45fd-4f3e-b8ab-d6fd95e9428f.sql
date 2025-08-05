-- Fix search_path security issues in all database functions
-- This prevents potential security vulnerabilities from search_path manipulation

-- Fix get_ai_model_config function
CREATE OR REPLACE FUNCTION public.get_ai_model_config(function_name_param text)
 RETURNS TABLE(model_name text, temperature numeric, max_tokens integer, top_p numeric, frequency_penalty numeric, presence_penalty numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    config.model_name,
    config.temperature,
    config.max_tokens,
    config.top_p,
    config.frequency_penalty,
    config.presence_penalty
  FROM public.ai_model_configurations config
  WHERE config.function_name = function_name_param;
END;
$function$;

-- Fix update_auth_provider function
CREATE OR REPLACE FUNCTION public.update_auth_provider()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Only update if auth_provider is null (first time login)
  IF NEW.auth_provider IS NULL THEN
    -- Check if user has OAuth identities
    IF EXISTS (
      SELECT 1 FROM auth.identities 
      WHERE user_id = NEW.user_id 
      AND provider != 'email'
    ) THEN
      -- Get the first OAuth provider
      SELECT provider INTO NEW.auth_provider
      FROM auth.identities 
      WHERE user_id = NEW.user_id 
      AND provider != 'email'
      LIMIT 1;
      
      -- Also add to linked_providers array
      NEW.linked_providers = ARRAY[NEW.auth_provider];
    ELSE
      -- Email/password registration
      NEW.auth_provider = 'email';
      NEW.linked_providers = ARRAY['email'];
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix add_linked_provider function
CREATE OR REPLACE FUNCTION public.add_linked_provider(_user_id uuid, _provider text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles 
  SET linked_providers = array_append(linked_providers, _provider)
  WHERE user_id = _user_id 
  AND NOT (_provider = ANY(linked_providers));
END;
$function$;

-- Fix remove_linked_provider function
CREATE OR REPLACE FUNCTION public.remove_linked_provider(_user_id uuid, _provider text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles 
  SET linked_providers = array_remove(linked_providers, _provider)
  WHERE user_id = _user_id;
  
  -- If removing the primary auth provider, set the first available one as primary
  UPDATE public.profiles 
  SET auth_provider = linked_providers[1]
  WHERE user_id = _user_id 
  AND auth_provider = _provider
  AND array_length(linked_providers, 1) > 0;
END;
$function$;

-- Fix create_agent_template_version function
CREATE OR REPLACE FUNCTION public.create_agent_template_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Crear una nueva versión con los datos antiguos antes de la actualización
  INSERT INTO public.agent_template_versions (
    template_id,
    version_number,
    name,
    description,
    instructions_template,
    category,
    pricing_model,
    pricing_amount,
    icon,
    tools_config,
    permissions_template,
    is_active,
    is_featured,
    created_by,
    change_notes,
    created_at
  ) VALUES (
    OLD.id,
    OLD.version,
    OLD.name,
    OLD.description,
    OLD.instructions_template,
    OLD.category,
    OLD.pricing_model,
    OLD.pricing_amount,
    OLD.icon,
    OLD.tools_config,
    OLD.permissions_template,
    OLD.is_active,
    OLD.is_featured,
    OLD.created_by,
    'Versión guardada automáticamente antes de actualización',
    OLD.updated_at
  );
  
  RETURN NEW;
END;
$function$;

-- Fix get_user_primary_company function
CREATE OR REPLACE FUNCTION public.get_user_primary_company(user_id_param uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    SELECT company_id 
    FROM public.company_members 
    WHERE user_id = user_id_param AND is_primary = true
    LIMIT 1
  );
END;
$function$;

-- Fix get_all_profiles_admin function
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
 RETURNS TABLE(id uuid, user_id uuid, email text, full_name text, user_type user_type, company_name text, website_url text, industry text, created_at timestamp with time zone, linked_providers text[], avatar_url text, user_position text, country text, location text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Esta función permite a los administradores ver todos los perfiles
  -- Sin restricciones de RLS
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.full_name,
    p.user_type,
    p.company_name,
    p.website_url,
    p.industry,
    p.created_at,
    p.linked_providers,
    p.avatar_url,
    p."position" as user_position, -- position es palabra reservada, usar comillas
    p.country,
    p.location
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$function$;

-- Add DELETE policy for profiles table if users should be able to delete their accounts
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Create admin security audit table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow viewing admin audit logs by system administrators
CREATE POLICY "Only system admins can view audit logs"
ON public.admin_audit_log
FOR ALL
USING (true); -- This will be restricted at application level