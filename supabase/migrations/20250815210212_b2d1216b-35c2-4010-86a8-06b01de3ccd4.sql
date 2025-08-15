-- Fix critical security issue: Restrict email system tables access to administrators only

-- Drop the current insecure policies that allow all users access
DROP POLICY IF EXISTS "Admin can manage email configurations" ON public.email_configurations;
DROP POLICY IF EXISTS "Admin can view email history" ON public.email_send_history;

-- Create secure policies for email_configurations that only allow verified administrators
CREATE POLICY "Only verified admins can view email configurations" 
ON public.email_configurations 
FOR SELECT 
USING (public.current_user_is_admin());

CREATE POLICY "Only verified admins can insert email configurations" 
ON public.email_configurations 
FOR INSERT 
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can update email configurations" 
ON public.email_configurations 
FOR UPDATE 
USING (public.current_user_is_admin()) 
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can delete email configurations" 
ON public.email_configurations 
FOR DELETE 
USING (public.current_user_is_admin());

-- Create secure policies for email_send_history that only allow verified administrators
CREATE POLICY "Only verified admins can view email history" 
ON public.email_send_history 
FOR SELECT 
USING (public.current_user_is_admin());

CREATE POLICY "Only verified admins can insert email history" 
ON public.email_send_history 
FOR INSERT 
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can update email history" 
ON public.email_send_history 
FOR UPDATE 
USING (public.current_user_is_admin()) 
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can delete email history" 
ON public.email_send_history 
FOR DELETE 
USING (public.current_user_is_admin());

-- Also secure the email_templates table which may contain sensitive template data
-- Check if it has insecure policies and fix them
DROP POLICY IF EXISTS "Admin can manage email templates" ON public.email_templates;

CREATE POLICY "Only verified admins can view email templates" 
ON public.email_templates 
FOR SELECT 
USING (public.current_user_is_admin());

CREATE POLICY "Only verified admins can insert email templates" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can update email templates" 
ON public.email_templates 
FOR UPDATE 
USING (public.current_user_is_admin()) 
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can delete email templates" 
ON public.email_templates 
FOR DELETE 
USING (public.current_user_is_admin());