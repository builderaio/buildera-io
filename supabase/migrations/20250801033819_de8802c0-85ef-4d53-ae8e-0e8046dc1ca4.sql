-- Arreglar la tabla social_media_analytics para incluir period_type con valor por defecto
ALTER TABLE public.social_media_analytics 
ALTER COLUMN period_type SET DEFAULT 'monthly';

-- Actualizar registros existentes que tengan period_type NULL
UPDATE public.social_media_analytics 
SET period_type = 'monthly' 
WHERE period_type IS NULL;

-- Asegurar que period_type sea NOT NULL
ALTER TABLE public.social_media_analytics 
ALTER COLUMN period_type SET NOT NULL;