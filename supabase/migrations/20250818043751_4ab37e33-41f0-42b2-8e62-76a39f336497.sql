-- Enable RLS on the view and create admin policy
ALTER VIEW public.company_members_with_profiles OWNER TO postgres;

-- Create RLS policies for the view
CREATE POLICY "Admins can view all company members with profiles"
ON public.company_members_with_profiles
FOR ALL
USING (public.current_user_is_admin());