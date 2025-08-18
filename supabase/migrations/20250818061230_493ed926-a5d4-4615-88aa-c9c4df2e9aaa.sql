-- Migrar company_branding a usar company_id
ALTER TABLE public.company_branding 
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Migrar datos existentes
UPDATE public.company_branding 
SET company_id = (
  SELECT cm.company_id 
  FROM public.company_members cm 
  WHERE cm.user_id = company_branding.user_id 
  AND cm.is_primary = true 
  LIMIT 1
)
WHERE company_id IS NULL;

-- Eliminar la columna user_id
ALTER TABLE public.company_branding DROP COLUMN user_id;

-- Hacer company_id obligatorio
ALTER TABLE public.company_branding ALTER COLUMN company_id SET NOT NULL;

-- Actualizar políticas RLS para company_branding
DROP POLICY IF EXISTS "Users can create their own branding" ON public.company_branding;
DROP POLICY IF EXISTS "Users can delete their own branding" ON public.company_branding;
DROP POLICY IF EXISTS "Users can update their own branding" ON public.company_branding;
DROP POLICY IF EXISTS "Users can view their own branding" ON public.company_branding;

CREATE POLICY "Company members can view branding" ON public.company_branding
FOR SELECT USING (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners and admins can create branding" ON public.company_branding
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company owners and admins can update branding" ON public.company_branding
FOR UPDATE USING (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company owners and admins can delete branding" ON public.company_branding
FOR DELETE USING (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);