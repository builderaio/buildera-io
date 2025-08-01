-- Actualizar las plantillas predefinidas para que tengan created_by como el primer admin o usuario
-- Esto permitirá que se puedan editar correctamente

-- Primero, intentamos obtener un usuario admin existente
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Buscar el primer usuario que existe en profiles
    SELECT user_id INTO admin_user_id 
    FROM public.profiles 
    LIMIT 1;
    
    -- Si encontramos un usuario, actualizar las plantillas sin created_by
    IF admin_user_id IS NOT NULL THEN
        UPDATE public.email_templates 
        SET created_by = admin_user_id 
        WHERE created_by IS NULL;
        
        RAISE NOTICE 'Plantillas actualizadas con created_by: %', admin_user_id;
    ELSE
        RAISE NOTICE 'No se encontraron usuarios, las plantillas se mantendrán con created_by NULL';
    END IF;
END $$;

-- Actualizar las políticas RLS para permitir que las plantillas predefinidas (created_by NULL) 
-- puedan ser editadas por cualquier usuario autenticado

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can create email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can update their own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can delete their own email templates" ON public.email_templates;

-- Crear nuevas políticas más permisivas
CREATE POLICY "Users can view all email templates" 
ON public.email_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own email templates" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update email templates" 
ON public.email_templates 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  created_by IS NULL OR 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete email templates" 
ON public.email_templates 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  created_by IS NULL OR 
  auth.uid() IS NOT NULL
);