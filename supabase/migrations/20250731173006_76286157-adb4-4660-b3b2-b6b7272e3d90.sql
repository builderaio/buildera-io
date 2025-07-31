-- Crear tabla para almacenar datos de páginas de Facebook
CREATE TABLE IF NOT EXISTS public.facebook_page_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_details JSONB,
  reviews JSONB,
  total_reviews INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.facebook_page_data ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view their own Facebook page data" 
ON public.facebook_page_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Facebook page data" 
ON public.facebook_page_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Facebook page data" 
ON public.facebook_page_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Facebook page data" 
ON public.facebook_page_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear índice para optimizar consultas
CREATE INDEX idx_facebook_page_data_user_id ON public.facebook_page_data(user_id);
CREATE INDEX idx_facebook_page_data_page_url ON public.facebook_page_data(page_url);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_facebook_page_data_updated_at
    BEFORE UPDATE ON public.facebook_page_data
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();