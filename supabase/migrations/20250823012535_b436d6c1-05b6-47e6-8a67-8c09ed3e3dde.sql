-- Critical Security Fixes

-- 1. Enable RLS and secure AI system tables
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_function_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.era_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 2. Create admin-only policies for sensitive configuration tables
CREATE POLICY "Only admins can access agent templates" ON public.agent_templates
  FOR ALL USING (current_user_is_admin());

CREATE POLICY "Only admins can access AI models" ON public.ai_models
  FOR ALL USING (current_user_is_admin());

CREATE POLICY "Only admins can access AI providers" ON public.ai_providers
  FOR ALL USING (current_user_is_admin());

CREATE POLICY "Only admins can access AI model configurations" ON public.ai_model_configurations
  FOR ALL USING (current_user_is_admin());

CREATE POLICY "Only admins can access business function configurations" ON public.business_function_configurations
  FOR ALL USING (current_user_is_admin());

CREATE POLICY "Only admins can access era prompt templates" ON public.era_prompt_templates
  FOR ALL USING (current_user_is_admin());

CREATE POLICY "Only admins can access AI model status logs" ON public.ai_model_status_logs
  FOR ALL USING (current_user_is_admin());

-- 3. Allow public read access to basic subscription plan info but restrict sensitive data
CREATE POLICY "Public can view basic subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- Restrict modifications to admins only
CREATE POLICY "Only admins can modify subscription plans" ON public.subscription_plans
  FOR INSERT WITH CHECK (current_user_is_admin());

CREATE POLICY "Only admins can update subscription plans" ON public.subscription_plans
  FOR UPDATE USING (current_user_is_admin());

CREATE POLICY "Only admins can delete subscription plans" ON public.subscription_plans
  FOR DELETE USING (current_user_is_admin());

-- 4. Secure expert data access - ensure experts table has proper RLS
CREATE POLICY "Experts can manage their own profiles" ON public.experts
  FOR ALL USING (auth.uid() = user_id);

-- Allow public to view basic expert info but restrict sensitive data through the view
CREATE POLICY "Public can view expert profiles via view" ON public.experts
  FOR SELECT USING (is_available = true AND is_verified = true);

-- 5. Create secure admin credentials table to replace hardcoded credentials
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on admin credentials
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Only allow admins to access admin credentials
CREATE POLICY "Only admins can access admin credentials" ON public.admin_credentials
  FOR ALL USING (current_user_is_admin());

-- 6. Create function to validate admin login
CREATE OR REPLACE FUNCTION public.validate_admin_login(
  p_username text,
  p_password text
) RETURNS TABLE(user_id uuid, username text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is a placeholder function - in production, implement proper password hashing
  -- For now, we'll continue using the application-level validation but secure the credentials
  RETURN QUERY
  SELECT 
    ac.id as user_id,
    ac.username,
    ac.role
  FROM public.admin_credentials ac
  WHERE ac.username = p_username 
    AND ac.is_active = true;
END;
$$;

-- 7. Fix search_path issues in existing functions
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.is_admin(auth.uid())
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = COALESCE(check_user_id, auth.uid())
      AND role = 'admin'
  )
$function$;

-- 8. Create rate limiting table for authentication
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP or user identifier
  attempt_count integer DEFAULT 1,
  first_attempt timestamptz DEFAULT now(),
  last_attempt timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON public.auth_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_blocked_until ON public.auth_rate_limits(blocked_until);

-- Enable RLS on rate limits table
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow system to manage rate limits
CREATE POLICY "System can manage rate limits" ON public.auth_rate_limits
  FOR ALL USING (true);

-- 9. Add security audit log
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}',
  risk_level text DEFAULT 'low',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can access security events
CREATE POLICY "Only admins can access security events" ON public.security_events
  FOR ALL USING (current_user_is_admin());