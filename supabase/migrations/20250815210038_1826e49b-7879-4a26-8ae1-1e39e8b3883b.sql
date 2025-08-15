-- Fix critical security issue: Restrict llm_api_keys access to administrators only
-- Drop the current insecure policy that allows all users access
DROP POLICY IF EXISTS "Admins can manage API keys" ON public.llm_api_keys;

-- Create secure policies that only allow verified administrators
CREATE POLICY "Only verified admins can view API keys" 
ON public.llm_api_keys 
FOR SELECT 
USING (public.current_user_is_admin());

CREATE POLICY "Only verified admins can insert API keys" 
ON public.llm_api_keys 
FOR INSERT 
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can update API keys" 
ON public.llm_api_keys 
FOR UPDATE 
USING (public.current_user_is_admin()) 
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can delete API keys" 
ON public.llm_api_keys 
FOR DELETE 
USING (public.current_user_is_admin());

-- Also secure the related tables that reference API keys
-- Fix llm_api_usage table policies
DROP POLICY IF EXISTS "Admins can view API usage" ON public.llm_api_usage;

CREATE POLICY "Only verified admins can view API usage" 
ON public.llm_api_usage 
FOR SELECT 
USING (public.current_user_is_admin());

CREATE POLICY "Only verified admins can insert API usage" 
ON public.llm_api_usage 
FOR INSERT 
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can update API usage" 
ON public.llm_api_usage 
FOR UPDATE 
USING (public.current_user_is_admin()) 
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can delete API usage" 
ON public.llm_api_usage 
FOR DELETE 
USING (public.current_user_is_admin());