-- Add preferred_language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'es' CHECK (preferred_language IN ('es', 'en', 'pt'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON public.profiles(preferred_language);

-- Add comment
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language for the platform (es, en, pt)';