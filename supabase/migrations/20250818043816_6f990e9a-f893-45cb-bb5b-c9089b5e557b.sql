-- Remove the view and create a function instead
DROP VIEW IF EXISTS public.company_members_with_profiles;

-- Create a function to get company members with profiles
CREATE OR REPLACE FUNCTION public.get_company_members_with_profiles()
RETURNS TABLE (
  company_id UUID,
  role TEXT,
  user_id UUID,
  full_name TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access this function
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    cm.company_id,
    cm.role,
    cm.user_id,
    p.full_name,
    p.email
  FROM public.company_members cm
  LEFT JOIN public.profiles p ON p.user_id = cm.user_id;
END;
$$;