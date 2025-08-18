-- Verificar si company_objectives existe y tiene la estructura esperada
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_objectives') THEN
        -- Eliminar políticas existentes de company_objectives
        DROP POLICY IF EXISTS "Users can create their own objectives" ON public.company_objectives;
        DROP POLICY IF EXISTS "Users can delete their own objectives" ON public.company_objectives;
        DROP POLICY IF EXISTS "Users can update their own objectives" ON public.company_objectives;
        DROP POLICY IF EXISTS "Users can view their own objectives" ON public.company_objectives;

        -- Agregar company_id si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_objectives' AND column_name = 'company_id') THEN
            ALTER TABLE public.company_objectives 
            ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;

        -- Migrar datos existentes si user_id existe
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_objectives' AND column_name = 'user_id') THEN
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
        END IF;

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
    END IF;
END $$;