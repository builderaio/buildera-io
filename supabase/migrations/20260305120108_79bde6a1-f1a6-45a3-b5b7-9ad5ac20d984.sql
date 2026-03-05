
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS workforce_profile TEXT DEFAULT 'unassigned';
