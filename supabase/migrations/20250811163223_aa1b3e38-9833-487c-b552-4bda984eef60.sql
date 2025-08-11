-- Fix security vulnerability in admin_audit_log table
-- Create proper admin role verification system

-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table for proper role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = COALESCE(check_user_id, auth.uid())
      AND role = 'admin'
  )
$$;

-- 4. Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.is_admin(auth.uid())
$$;

-- 5. Drop the insecure policy on admin_audit_log
DROP POLICY IF EXISTS "Only system admins can view audit logs" ON public.admin_audit_log;

-- 6. Create secure RLS policies for admin_audit_log
CREATE POLICY "Only verified admins can view audit logs"
    ON public.admin_audit_log
    FOR SELECT
    TO authenticated
    USING (public.current_user_is_admin());

CREATE POLICY "Only verified admins can insert audit logs"
    ON public.admin_audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can update audit logs"
    ON public.admin_audit_log
    FOR UPDATE
    TO authenticated
    USING (public.current_user_is_admin())
    WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only verified admins can delete audit logs"
    ON public.admin_audit_log
    FOR DELETE
    TO authenticated
    USING (public.current_user_is_admin());

-- 7. Create RLS policies for user_roles table
CREATE POLICY "Admins can view all user roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (public.current_user_is_admin());

CREATE POLICY "Admins can manage user roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.current_user_is_admin())
    WITH CHECK (public.current_user_is_admin());

-- 8. Create function to assign admin role (for initial setup)
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if current user is already an admin OR if no admins exist yet (bootstrap case)
  IF public.current_user_is_admin() OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (target_user_id, 'admin', auth.uid())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 9. Add helpful comment
COMMENT ON TABLE public.admin_audit_log IS 'Stores admin activity logs with proper RLS protection requiring verified admin role';
COMMENT ON FUNCTION public.is_admin IS 'Security definer function to check if a user has admin role';
COMMENT ON FUNCTION public.current_user_is_admin IS 'Check if currently authenticated user is an admin';
COMMENT ON FUNCTION public.assign_admin_role IS 'Assign admin role to a user (bootstrap safe)';