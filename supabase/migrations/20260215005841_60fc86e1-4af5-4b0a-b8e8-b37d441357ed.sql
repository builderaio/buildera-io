
-- Add missing Strategic DNA fields to company_play_to_win
ALTER TABLE public.company_play_to_win
  ADD COLUMN IF NOT EXISTS business_model text,
  ADD COLUMN IF NOT EXISTS current_situation text,
  ADD COLUMN IF NOT EXISTS future_positioning text,
  ADD COLUMN IF NOT EXISTS desired_audience_positioning text,
  ADD COLUMN IF NOT EXISTS competitive_category text,
  ADD COLUMN IF NOT EXISTS key_assets text;
