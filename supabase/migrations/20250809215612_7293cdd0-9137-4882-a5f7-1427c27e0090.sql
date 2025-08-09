-- Fix first-login failure: add missing column used by triggers/inserts
-- Context: Error "column company_name of relation profiles does not exist" during /callback

-- 1) Add company_name to profiles (safe if already exists)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 2) Optional backfill: if user has a primary company, copy its name (best effort)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'name'
  ) THEN
    UPDATE public.profiles p
    SET company_name = c.name
    FROM public.company_members cm
    JOIN public.companies c ON c.id = cm.company_id
    WHERE cm.user_id = p.user_id AND cm.is_primary = true
      AND (p.company_name IS NULL OR p.company_name = '');
  END IF;
END $$;

-- 3) Ensure updated_at triggers keep working (no changes needed), just touch updated_at for consistency
UPDATE public.profiles SET updated_at = now() WHERE company_name IS NOT NULL;