
ALTER TABLE public.social_accounts
  ADD COLUMN IF NOT EXISTS reauth_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_business_location_id text;
