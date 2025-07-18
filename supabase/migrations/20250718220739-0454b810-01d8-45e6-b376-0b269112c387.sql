-- Crear bucket de storage para archivos de marca
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true);

-- Crear tabla de configuración de marca
CREATE TABLE public.company_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_color TEXT,
  secondary_color TEXT,
  complementary_color_1 TEXT,
  complementary_color_2 TEXT,
  visual_identity TEXT,
  logo_url TEXT,
  logo_file_path TEXT,
  brand_manual_url TEXT,
  brand_manual_file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar Row Level Security
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view their own branding" 
ON public.company_branding 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own branding" 
ON public.company_branding 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own branding" 
ON public.company_branding 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own branding" 
ON public.company_branding 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear trigger para actualizar timestamps
CREATE TRIGGER update_company_branding_updated_at
BEFORE UPDATE ON public.company_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear políticas para storage bucket brand-assets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');

CREATE POLICY "Users can upload brand assets" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their brand assets" ON storage.objects 
FOR UPDATE USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their brand assets" ON storage.objects 
FOR DELETE USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);