-- Security fix for expert information exposure - Clean approach
-- Step 1: Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public can view basic expert profiles" ON public.experts;
DROP POLICY IF EXISTS "Authenticated users can view expert pricing" ON public.experts;
DROP POLICY IF EXISTS "Specializations are viewable by everyone" ON public.expert_specializations;
DROP POLICY IF EXISTS "Expert availability is viewable by everyone" ON public.expert_availability;
DROP POLICY IF EXISTS "Public can view specializations of available experts" ON public.expert_specializations;
DROP POLICY IF EXISTS "Public can view availability of available experts" ON public.expert_availability;

-- Step 2: Create secure RLS policy for authenticated users only
CREATE POLICY "Authenticated users can view available expert profiles" 
ON public.experts 
FOR SELECT 
USING (
  is_available = true 
  AND is_verified = true 
  AND auth.uid() IS NOT NULL
);

-- Step 3: Create a view for public expert profiles that excludes sensitive data
CREATE OR REPLACE VIEW public.expert_public_profiles AS
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

-- Step 4: Grant access to the public view
GRANT SELECT ON public.expert_public_profiles TO public;

-- Step 5: Create function to get expert pricing for authenticated users only
CREATE OR REPLACE FUNCTION public.get_expert_pricing(expert_id uuid)
RETURNS TABLE(hourly_rate numeric, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.hourly_rate, e.email
  FROM experts e
  WHERE e.id = expert_id 
    AND e.is_available = true 
    AND e.is_verified = true
    AND auth.uid() IS NOT NULL;
$$;

-- Step 6: Secure policies for specializations - only for authenticated users
CREATE POLICY "Authenticated users can view expert specializations" 
ON public.expert_specializations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND expert_id IN (
    SELECT id FROM experts 
    WHERE is_available = true AND is_verified = true
  )
);

-- Step 7: Secure policies for availability - only for authenticated users
CREATE POLICY "Authenticated users can view expert availability" 
ON public.expert_availability 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND expert_id IN (
    SELECT id FROM experts 
    WHERE is_available = true AND is_verified = true
  )
);

-- Step 8: Add comments for documentation
COMMENT ON VIEW public.expert_public_profiles IS 'Public view of expert profiles excluding sensitive information like email and hourly rates';
COMMENT ON FUNCTION public.get_expert_pricing IS 'Secure function to get expert pricing information for authenticated users only';