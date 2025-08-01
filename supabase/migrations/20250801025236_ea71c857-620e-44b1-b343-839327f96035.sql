-- Crear tabla para perfiles de páginas de Facebook
CREATE TABLE public.facebook_page_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT,
  page_url TEXT,
  followers_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  categories TEXT[],
  description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  rating NUMERIC,
  verified BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  cover_image_url TEXT,
  raw_data JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, page_id)
);

-- Habilitar RLS
ALTER TABLE public.facebook_page_profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view their own Facebook page profiles" 
ON public.facebook_page_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Facebook page profiles" 
ON public.facebook_page_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Facebook page profiles" 
ON public.facebook_page_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Facebook page profiles" 
ON public.facebook_page_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_facebook_page_profiles_updated_at
BEFORE UPDATE ON public.facebook_page_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear tabla para perfiles de LinkedIn (datos del perfil personal/empresa)
CREATE TABLE public.linkedin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  linkedin_user_id TEXT,
  profile_url TEXT,
  name TEXT,
  headline TEXT,
  location TEXT,
  connections_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  industry TEXT,
  profile_picture_url TEXT,
  background_image_url TEXT,
  summary TEXT,
  experience JSONB,
  education JSONB,
  skills JSONB,
  raw_data JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, linkedin_user_id)
);

-- Habilitar RLS para LinkedIn profiles
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para LinkedIn profiles
CREATE POLICY "Users can view their own LinkedIn profiles" 
ON public.linkedin_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own LinkedIn profiles" 
ON public.linkedin_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LinkedIn profiles" 
ON public.linkedin_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own LinkedIn profiles" 
ON public.linkedin_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_linkedin_profiles_updated_at
BEFORE UPDATE ON public.linkedin_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();