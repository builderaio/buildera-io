-- Agregar campos para almacenar la información del webhook n8n
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS descripcion_empresa TEXT,
ADD COLUMN IF NOT EXISTS industria_principal TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_data JSONB,
ADD COLUMN IF NOT EXISTS webhook_processed_at TIMESTAMP WITH TIME ZONE;

-- Crear índices para mejorar el rendimiento en búsquedas
CREATE INDEX IF NOT EXISTS idx_companies_industria_principal ON public.companies(industria_principal);
CREATE INDEX IF NOT EXISTS idx_companies_webhook_processed ON public.companies(webhook_processed_at) WHERE webhook_processed_at IS NOT NULL;