-- Crear tablas para gestionar las conexiones de Facebook e Instagram

-- Tabla para conexiones de Facebook
CREATE TABLE public.facebook_instagram_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  facebook_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'long_lived',
  expires_at TIMESTAMP WITH TIME ZONE,
  user_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, facebook_user_id)
);

-- Tabla para conexiones específicas de Instagram Business
CREATE TABLE public.instagram_business_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  facebook_page_id TEXT NOT NULL,
  instagram_account_id TEXT NOT NULL,
  page_access_token TEXT NOT NULL,
  account_data JSONB,
  insights_data JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, instagram_account_id)
);

-- Tabla para registro de publicaciones
CREATE TABLE public.instagram_publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instagram_account_id TEXT NOT NULL,
  media_id TEXT NOT NULL,
  content_data JSONB NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.facebook_instagram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_business_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_publications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para facebook_instagram_connections
CREATE POLICY "Users can view their own Facebook connections" 
ON public.facebook_instagram_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Facebook connections" 
ON public.facebook_instagram_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Facebook connections" 
ON public.facebook_instagram_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Facebook connections" 
ON public.facebook_instagram_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para instagram_business_connections
CREATE POLICY "Users can view their own Instagram connections" 
ON public.instagram_business_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Instagram connections" 
ON public.instagram_business_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Instagram connections" 
ON public.instagram_business_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Instagram connections" 
ON public.instagram_business_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para instagram_publications
CREATE POLICY "Users can view their own Instagram publications" 
ON public.instagram_publications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Instagram publications" 
ON public.instagram_publications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Triggers para actualizar updated_at
CREATE TRIGGER update_facebook_instagram_connections_updated_at
BEFORE UPDATE ON public.facebook_instagram_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instagram_business_connections_updated_at
BEFORE UPDATE ON public.instagram_business_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_facebook_connections_user_id ON public.facebook_instagram_connections(user_id);
CREATE INDEX idx_instagram_connections_user_id ON public.instagram_business_connections(user_id);
CREATE INDEX idx_instagram_publications_user_id ON public.instagram_publications(user_id);
CREATE INDEX idx_instagram_publications_account_id ON public.instagram_publications(instagram_account_id);