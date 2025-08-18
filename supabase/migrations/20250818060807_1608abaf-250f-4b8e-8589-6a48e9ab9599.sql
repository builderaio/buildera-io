-- Migrar datos existentes si company_id es NULL
UPDATE public.company_strategy 
SET company_id = (
  SELECT cm.company_id 
  FROM public.company_members cm 
  WHERE cm.user_id = company_strategy.user_id 
  AND cm.is_primary = true 
  LIMIT 1
)
WHERE company_id IS NULL;

-- Eliminar la columna user_id
ALTER TABLE public.company_strategy DROP COLUMN user_id;

-- Hacer company_id obligatorio
ALTER TABLE public.company_strategy ALTER COLUMN company_id SET NOT NULL;

-- Crear nuevas políticas basadas en company_id
CREATE POLICY "Company members can view strategy" ON public.company_strategy
FOR SELECT USING (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners and admins can create strategy" ON public.company_strategy
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company owners and admins can update strategy" ON public.company_strategy
FOR UPDATE USING (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company owners and admins can delete strategy" ON public.company_strategy
FOR DELETE USING (
  company_id IN (
    SELECT cm.company_id 
    FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);