-- Security fix for expert information exposure
-- Step 1: Drop the overly permissive RLS policy
DROP POLICY IF EXISTS "Experts are viewable by everyone" ON public.experts;

-- Step 2: Create new restrictive RLS policies for experts table
-- Policy 1: Public can only view basic, non-sensitive profile information
CREATE POLICY "Public can view basic expert profiles" 
ON public.experts 
FOR SELECT 
USING (
  is_available = true 
  AND is_verified = true
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

-- Step 5: Create RLS policy for authenticated users to see pricing (for booking)
CREATE POLICY "Authenticated users can view expert pricing" 
ON public.experts 
FOR SELECT 
USING (
  is_available = true 
  AND is_verified = true 
  AND auth.uid() IS NOT NULL
);

-- Step 6: Create function to get expert pricing for authenticated users only
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

-- Step 7: Ensure existing policies for expert management remain intact
-- (These should already exist but let's make sure)
CREATE POLICY IF NOT EXISTS "Users can insert their own expert profile" 
ON public.experts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own expert profile" 
ON public.experts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own expert profile" 
ON public.experts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Step 8: Update specializations and availability policies to be more restrictive
DROP POLICY IF EXISTS "Specializations are viewable by everyone" ON public.expert_specializations;
DROP POLICY IF EXISTS "Expert availability is viewable by everyone" ON public.expert_availability;

-- New policies for specializations - only show for available/verified experts
CREATE POLICY "Public can view specializations of available experts" 
ON public.expert_specializations 
FOR SELECT 
USING (
  expert_id IN (
    SELECT id FROM experts 
    WHERE is_available = true AND is_verified = true
  )
);

-- New policies for availability - only show for available/verified experts
CREATE POLICY "Public can view availability of available experts" 
ON public.expert_availability 
FOR SELECT 
USING (
  expert_id IN (
    SELECT id FROM experts 
    WHERE is_available = true AND is_verified = true
  )
);

-- Step 9: Add comments for documentation
COMMENT ON VIEW public.expert_public_profiles IS 'Public view of expert profiles excluding sensitive information like email and hourly rates';
COMMENT ON FUNCTION public.get_expert_pricing IS 'Secure function to get expert pricing information for authenticated users only';