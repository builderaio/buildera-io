-- Crear tabla para configuraciones de IA
CREATE TABLE public.ai_model_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL UNIQUE,
  model_name TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 500,
  top_p DECIMAL(3,2) DEFAULT 1.0,
  frequency_penalty DECIMAL(3,2) DEFAULT 0.0,
  presence_penalty DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar configuraciones por defecto para las funciones existentes
INSERT INTO public.ai_model_configurations (function_name, model_name, temperature, max_tokens) VALUES
('era-chat', 'gpt-4o-mini', 0.7, 500),
('era-content-optimizer', 'gpt-4o-mini', 0.7, 500),
('generate-company-content', 'gpt-4o-mini', 0.7, 300);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_ai_model_configurations_updated_at
  BEFORE UPDATE ON public.ai_model_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para obtener configuración de un modelo
CREATE OR REPLACE FUNCTION public.get_ai_model_config(function_name_param TEXT)
RETURNS TABLE(
  model_name TEXT,
  temperature DECIMAL,
  max_tokens INTEGER,
  top_p DECIMAL,
  frequency_penalty DECIMAL,
  presence_penalty DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    config.model_name,
    config.temperature,
    config.max_tokens,
    config.top_p,
    config.frequency_penalty,
    config.presence_penalty
  FROM public.ai_model_configurations config
  WHERE config.function_name = function_name_param;
END;
$$;