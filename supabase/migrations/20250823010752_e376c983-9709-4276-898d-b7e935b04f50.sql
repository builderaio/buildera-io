-- Fix Security Definer View warning by dropping the view and using direct table access with proper RLS
DROP VIEW IF EXISTS public.expert_public_profiles;

-- Remove the grant that's no longer needed
-- REVOKE SELECT ON public.expert_public_profiles FROM public; (not needed since view is dropped)

-- The RLS policies we created earlier are sufficient for security
-- The frontend will now use the experts table directly with the new RLS policies