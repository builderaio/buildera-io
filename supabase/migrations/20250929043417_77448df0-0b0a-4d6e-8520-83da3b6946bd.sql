-- Permitir a todos los usuarios autenticados ver las plantillas activas de agentes
DROP POLICY IF EXISTS "Only admins can access agent templates" ON public.agent_templates;

-- Crear nueva política que permite ver plantillas activas a usuarios autenticados
CREATE POLICY "Users can view active agent templates" 
ON public.agent_templates 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Los admins siguen teniendo acceso completo
CREATE POLICY "Admins can manage all agent templates" 
ON public.agent_templates 
FOR ALL 
TO authenticated 
USING (current_user_is_admin())
WITH CHECK (current_user_is_admin());