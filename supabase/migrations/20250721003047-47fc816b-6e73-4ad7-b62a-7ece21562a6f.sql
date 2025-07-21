-- Crear tabla para almacenar las selecciones de modelos de IA por proveedor
CREATE TABLE IF NOT EXISTS public.ai_model_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  api_key_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider)
);

-- Habilitar RLS
ALTER TABLE public.ai_model_selections ENABLE ROW LEVEL SECURITY;

-- Políticas para administradores
CREATE POLICY "Admins can manage AI model selections" 
ON public.ai_model_selections 
FOR ALL 
USING (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_ai_model_selections_updated_at
BEFORE UPDATE ON public.ai_model_selections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();