-- Verificar y actualizar las políticas RLS para ai_model_configurations
-- Eliminar las políticas existentes si causan problemas
DROP POLICY IF EXISTS "Allow authenticated users to read AI model configurations" ON public.ai_model_configurations;
DROP POLICY IF EXISTS "Only service role can modify AI model configurations" ON public.ai_model_configurations;

-- Crear nuevas políticas más específicas
CREATE POLICY "Admins can read AI model configurations" 
ON public.ai_model_configurations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update AI model configurations" 
ON public.ai_model_configurations 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can insert AI model configurations" 
ON public.ai_model_configurations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can delete AI model configurations" 
ON public.ai_model_configurations 
FOR DELETE 
USING (true);