-- Eliminar todas las políticas de company_objectives primero
DROP POLICY IF EXISTS "Users can create their own company objectives" ON public.company_objectives;
DROP POLICY IF EXISTS "Users can delete their own company objectives" ON public.company_objectives;
DROP POLICY IF EXISTS "Users can update their own company objectives" ON public.company_objectives;
DROP POLICY IF EXISTS "Users can view their own company objectives" ON public.company_objectives;

-- Agregar company_id a company_objectives
ALTER TABLE public.company_objectives 
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Migrar datos existentes
UPDATE public.company_objectives 
SET company_id = (
  SELECT cm.company_id 
  FROM public.company_members cm 
  WHERE cm.user_id = company_objectives.user_id 
  AND cm.is_primary = true 
  LIMIT 1
)
WHERE company_id IS NULL;

-- Eliminar la columna user_id
ALTER TABLE public.company_objectives DROP COLUMN user_id;

-- Hacer company_id obligatorio
ALTER TABLE public.company_objectives ALTER COLUMN company_id SET NOT NULL;

-- Crear nuevas políticas para company_objectives
CREATE POLICY "Company members can view objectives" ON public.company_objectives
FOR SELECT USING (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners and admins can create objectives" ON public.company_objectives
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company owners and admins can update objectives" ON public.company_objectives
FOR UPDATE USING (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company owners and admins can delete objectives" ON public.company_objectives
FOR DELETE USING (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);