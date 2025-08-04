-- Migración para normalizar la estructura de profiles y companies

-- 1. Primero, migrar datos de profiles a companies donde sea necesario
UPDATE public.companies 
SET 
  website_url = COALESCE(companies.website_url, p.website_url),
  industry_sector = COALESCE(companies.industry_sector, p.industry),
  name = COALESCE(companies.name, p.company_name)
FROM public.profiles p
JOIN public.company_members cm ON cm.user_id = p.user_id
WHERE companies.id = cm.company_id 
  AND cm.is_primary = true
  AND (
    companies.website_url IS NULL OR 
    companies.industry_sector IS NULL OR 
    companies.name = 'Mi Empresa'
  );

-- 2. Consolidar campos duplicados en companies
UPDATE public.companies 
SET 
  description = COALESCE(descripcion_empresa, description),
  industry_sector = COALESCE(industria_principal, industry_sector)
WHERE descripcion_empresa IS NOT NULL OR industria_principal IS NOT NULL;

-- 3. Eliminar campos duplicados de companies
ALTER TABLE public.companies 
DROP COLUMN IF EXISTS descripcion_empresa,
DROP COLUMN IF EXISTS industria_principal;

-- 4. Limpiar campos de empresa en profiles (mantener solo info personal)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS company_name,
DROP COLUMN IF EXISTS website_url,
DROP COLUMN IF EXISTS industry,
DROP COLUMN IF EXISTS company_size;

-- 5. Agregar campos faltantes a companies si no existen
DO $$ 
BEGIN
  -- Verificar y agregar columna company_size si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'company_size'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN company_size TEXT;
  END IF;
  
  -- Verificar y agregar columna country si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'country'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN country TEXT;
  END IF;
  
  -- Verificar y agregar columna location si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'location'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN location TEXT;
  END IF;
END $$;

-- 6. Crear función helper para obtener empresa principal del usuario
CREATE OR REPLACE FUNCTION public.get_user_primary_company_data(user_id_param uuid)
RETURNS TABLE(
  company_id uuid,
  company_name text,
  description text,
  website_url text,
  industry_sector text,
  company_size text,
  country text,
  location text,
  logo_url text,
  primary_color text,
  secondary_color text,
  facebook_url text,
  twitter_url text,
  linkedin_url text,
  instagram_url text,
  youtube_url text,
  tiktok_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.website_url,
    c.industry_sector,
    c.company_size,
    c.country,
    c.location,
    c.logo_url,
    c.primary_color,
    c.secondary_color,
    c.facebook_url,
    c.twitter_url,
    c.linkedin_url,
    c.instagram_url,
    c.youtube_url,
    c.tiktok_url,
    c.created_at,
    c.updated_at
  FROM public.companies c
  JOIN public.company_members cm ON cm.company_id = c.id
  WHERE cm.user_id = user_id_param 
    AND cm.is_primary = true
  LIMIT 1;
END;
$function$;

-- 7. Crear función para actualizar empresa principal
CREATE OR REPLACE FUNCTION public.update_user_primary_company(
  user_id_param uuid,
  company_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  company_id_result uuid;
BEGIN
  -- Obtener la empresa principal del usuario
  SELECT c.id INTO company_id_result
  FROM public.companies c
  JOIN public.company_members cm ON cm.company_id = c.id
  WHERE cm.user_id = user_id_param 
    AND cm.is_primary = true
  LIMIT 1;
  
  -- Si no tiene empresa principal, crear una
  IF company_id_result IS NULL THEN
    company_id_result := public.create_company_with_owner(
      (company_data->>'name')::text,
      (company_data->>'description')::text,
      (company_data->>'website_url')::text,
      (company_data->>'industry_sector')::text,
      (company_data->>'company_size')::text,
      user_id_param
    );
  ELSE
    -- Actualizar empresa existente
    UPDATE public.companies
    SET 
      name = COALESCE((company_data->>'name')::text, name),
      description = COALESCE((company_data->>'description')::text, description),
      website_url = COALESCE((company_data->>'website_url')::text, website_url),
      industry_sector = COALESCE((company_data->>'industry_sector')::text, industry_sector),
      company_size = COALESCE((company_data->>'company_size')::text, company_size),
      country = COALESCE((company_data->>'country')::text, country),
      location = COALESCE((company_data->>'location')::text, location),
      logo_url = COALESCE((company_data->>'logo_url')::text, logo_url),
      primary_color = COALESCE((company_data->>'primary_color')::text, primary_color),
      secondary_color = COALESCE((company_data->>'secondary_color')::text, secondary_color),
      facebook_url = COALESCE((company_data->>'facebook_url')::text, facebook_url),
      twitter_url = COALESCE((company_data->>'twitter_url')::text, twitter_url),
      linkedin_url = COALESCE((company_data->>'linkedin_url')::text, linkedin_url),
      instagram_url = COALESCE((company_data->>'instagram_url')::text, instagram_url),
      youtube_url = COALESCE((company_data->>'youtube_url')::text, youtube_url),
      tiktok_url = COALESCE((company_data->>'tiktok_url')::text, tiktok_url),
      updated_at = now()
    WHERE id = company_id_result;
  END IF;
  
  RETURN company_id_result;
END;
$function$;