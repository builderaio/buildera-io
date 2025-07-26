-- Crear tabla para historial de versiones de plantillas de agentes
CREATE TABLE public.agent_template_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.agent_templates(id) ON DELETE CASCADE,
  version_number VARCHAR(20) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructions_template TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  pricing_model TEXT NOT NULL DEFAULT 'free',
  pricing_amount NUMERIC DEFAULT 0,
  icon TEXT,
  tools_config JSONB DEFAULT '[]'::jsonb,
  permissions_template JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  change_notes TEXT, -- Notas sobre qué cambió en esta versión
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Índices para rendimiento
  UNIQUE(template_id, version_number)
);

-- Habilitar RLS
ALTER TABLE public.agent_template_versions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para administradores
CREATE POLICY "Admins can manage agent template versions" 
ON public.agent_template_versions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Función para crear versión automáticamente al actualizar plantilla
CREATE OR REPLACE FUNCTION public.create_agent_template_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear una nueva versión con los datos antiguos antes de la actualización
  INSERT INTO public.agent_template_versions (
    template_id,
    version_number,
    name,
    description,
    instructions_template,
    category,
    pricing_model,
    pricing_amount,
    icon,
    tools_config,
    permissions_template,
    is_active,
    is_featured,
    created_by,
    change_notes,
    created_at
  ) VALUES (
    OLD.id,
    OLD.version,
    OLD.name,
    OLD.description,
    OLD.instructions_template,
    OLD.category,
    OLD.pricing_model,
    OLD.pricing_amount,
    OLD.icon,
    OLD.tools_config,
    OLD.permissions_template,
    OLD.is_active,
    OLD.is_featured,
    OLD.created_by,
    'Versión guardada automáticamente antes de actualización',
    OLD.updated_at
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para crear versión automáticamente
CREATE TRIGGER create_agent_template_version_trigger
  BEFORE UPDATE ON public.agent_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.create_agent_template_version();

-- Función para restaurar una versión específica
CREATE OR REPLACE FUNCTION public.restore_agent_template_version(
  template_id_param UUID,
  version_number_param VARCHAR(20),
  new_version_param VARCHAR(20)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  version_data RECORD;
BEGIN
  -- Obtener los datos de la versión a restaurar
  SELECT * INTO version_data
  FROM public.agent_template_versions
  WHERE template_id = template_id_param 
    AND version_number = version_number_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Versión no encontrada';
  END IF;
  
  -- Actualizar la plantilla principal con los datos de la versión
  UPDATE public.agent_templates
  SET
    name = version_data.name,
    description = version_data.description,
    instructions_template = version_data.instructions_template,
    category = version_data.category,
    pricing_model = version_data.pricing_model,
    pricing_amount = version_data.pricing_amount,
    icon = version_data.icon,
    tools_config = version_data.tools_config,
    permissions_template = version_data.permissions_template,
    is_active = version_data.is_active,
    is_featured = version_data.is_featured,
    version = new_version_param,
    updated_at = now()
  WHERE id = template_id_param;
  
  -- Registrar la restauración en el historial
  INSERT INTO public.agent_template_versions (
    template_id,
    version_number,
    name,
    description,
    instructions_template,
    category,
    pricing_model,
    pricing_amount,
    icon,
    tools_config,
    permissions_template,
    is_active,
    is_featured,
    created_by,
    change_notes
  ) VALUES (
    template_id_param,
    new_version_param,
    version_data.name,
    version_data.description,
    version_data.instructions_template,
    version_data.category,
    version_data.pricing_model,
    version_data.pricing_amount,
    version_data.icon,
    version_data.tools_config,
    version_data.permissions_template,
    version_data.is_active,
    version_data.is_featured,
    version_data.created_by,
    'Restauración desde versión ' || version_number_param
  );
  
  RETURN TRUE;
END;
$$;

-- Trigger para crear la versión inicial al insertar una nueva plantilla
CREATE OR REPLACE FUNCTION public.create_initial_agent_template_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear la versión inicial
  INSERT INTO public.agent_template_versions (
    template_id,
    version_number,
    name,
    description,
    instructions_template,
    category,
    pricing_model,
    pricing_amount,
    icon,
    tools_config,
    permissions_template,
    is_active,
    is_featured,
    created_by,
    change_notes
  ) VALUES (
    NEW.id,
    NEW.version,
    NEW.name,
    NEW.description,
    NEW.instructions_template,
    NEW.category,
    NEW.pricing_model,
    NEW.pricing_amount,
    NEW.icon,
    NEW.tools_config,
    NEW.permissions_template,
    NEW.is_active,
    NEW.is_featured,
    NEW.created_by,
    'Versión inicial'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para versión inicial
CREATE TRIGGER create_initial_agent_template_version_trigger
  AFTER INSERT ON public.agent_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.create_initial_agent_template_version();

-- Agregar trigger para updated_at en la tabla de versiones
CREATE TRIGGER update_agent_template_versions_updated_at
  BEFORE UPDATE ON public.agent_template_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();