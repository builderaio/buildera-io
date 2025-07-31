-- Agregar columnas para información enriquecida de la empresa
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS descripcion_empresa TEXT,
ADD COLUMN IF NOT EXISTS industria_principal TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;