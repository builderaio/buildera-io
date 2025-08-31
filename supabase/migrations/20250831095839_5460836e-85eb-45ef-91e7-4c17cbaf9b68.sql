-- Add new columns to company_branding table to store complete brand identity data
ALTER TABLE public.company_branding 
ADD COLUMN IF NOT EXISTS color_justifications jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS brand_voice jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS visual_synthesis jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS full_brand_data jsonb DEFAULT '{}';

-- Add comments to describe the new columns
COMMENT ON COLUMN public.company_branding.color_justifications IS 'Stores justifications for each color choice from the brand identity API';
COMMENT ON COLUMN public.company_branding.brand_voice IS 'Stores brand voice personality, description and keywords';
COMMENT ON COLUMN public.company_branding.visual_synthesis IS 'Stores visual concept, typography and photography style';
COMMENT ON COLUMN public.company_branding.full_brand_data IS 'Stores complete brand identity response from API for future reference';