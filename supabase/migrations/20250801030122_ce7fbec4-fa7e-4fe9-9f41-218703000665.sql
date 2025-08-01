-- Crear tabla para perfiles de Instagram
CREATE TABLE IF NOT EXISTS public.instagram_user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instagram_user_id TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  biography TEXT,
  profile_pic_url TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_business BOOLEAN DEFAULT false,
  business_category TEXT,
  external_url TEXT,
  raw_data JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, instagram_user_id)
);

-- Habilitar RLS
ALTER TABLE public.instagram_user_profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para instagram_user_profiles
CREATE POLICY "Users can view their own Instagram profiles" 
ON public.instagram_user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Instagram profiles" 
ON public.instagram_user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Instagram profiles" 
ON public.instagram_user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Instagram profiles" 
ON public.instagram_user_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear trigger para updated_at
CREATE TRIGGER update_instagram_user_profiles_updated_at
  BEFORE UPDATE ON public.instagram_user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();