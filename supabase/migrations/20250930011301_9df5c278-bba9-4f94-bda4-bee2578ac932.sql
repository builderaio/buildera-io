-- Agregar campo linkedin_page_id a la tabla social_accounts
ALTER TABLE public.social_accounts 
ADD COLUMN IF NOT EXISTS linkedin_page_id TEXT;