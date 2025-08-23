-- Fix Security Definer View issue by recreating expert_public_profiles as regular view
DROP VIEW IF EXISTS public.expert_public_profiles;

-- Create a regular view (not security definer) for public expert profiles
CREATE VIEW public.expert_public_profiles AS
SELECT 
  e.id,
  e.user_id,
  e.full_name,
  e.bio,
  e.avatar_url,
  e.specializations,
  e.experience_years,
  e.rating,
  e.total_sessions,
  e.languages,
  e.is_available,
  e.is_verified,
  e.created_at
FROM public.experts e
WHERE e.is_available = true 
  AND e.is_verified = true;