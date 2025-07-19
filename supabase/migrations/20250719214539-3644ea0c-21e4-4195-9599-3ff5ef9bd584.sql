-- Modificar la tabla llm_api_keys para quitar model_name como requerido
ALTER TABLE public.llm_api_keys 
ALTER COLUMN model_name DROP NOT NULL;

-- Agregar campo para modelos disponibles/preferidos
ALTER TABLE public.llm_api_keys 
ADD COLUMN available_models TEXT[] DEFAULT '{}';

-- Actualizar datos existentes
UPDATE public.llm_api_keys 
SET available_models = ARRAY[model_name] 
WHERE model_name IS NOT NULL;

-- Agregar comentarios para clarificar
COMMENT ON COLUMN public.llm_api_keys.model_name IS 'Modelo por defecto (opcional)';
COMMENT ON COLUMN public.llm_api_keys.available_models IS 'Lista de modelos disponibles con esta API key';