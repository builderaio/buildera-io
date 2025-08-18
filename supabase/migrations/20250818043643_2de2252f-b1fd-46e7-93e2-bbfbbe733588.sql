-- Create a stable view to avoid PostgREST relationship cache issues
CREATE OR REPLACE VIEW public.company_members_with_profiles AS
SELECT 
  cm.company_id,
  cm.role,
  cm.user_id,
  p.full_name,
  p.email
FROM public.company_members cm
LEFT JOIN public.profiles p
  ON p.user_id = cm.user_id;