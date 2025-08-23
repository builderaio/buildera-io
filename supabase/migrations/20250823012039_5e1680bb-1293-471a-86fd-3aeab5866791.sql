-- Fix the Security Definer View issue by making it a regular view
-- Drop the problematic view
DROP VIEW IF EXISTS public.expert_public_profiles;

-- Create a regular view (not security definer) for public expert profiles
CREATE VIEW public.expert_public_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  specialization,
  bio,
  experience_years,
  rating,
  total_sessions,
  languages,
  timezone,
  profile_image_url,
  linkedin_url,
  website_url,
  is_available,
  is_verified,
  created_at
FROM public.experts
WHERE is_available = true AND is_verified = true;

-- Grant access to the public view
GRANT SELECT ON public.expert_public_profiles TO public;

-- Add comment for documentation
COMMENT ON VIEW public.expert_public_profiles IS 'Public view of expert profiles excluding sensitive information like email and hourly rates';