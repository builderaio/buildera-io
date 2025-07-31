-- Crear tabla facebook_posts que falta
CREATE TABLE IF NOT EXISTS public.facebook_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id TEXT NOT NULL,
  post_type TEXT,
  content TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE,
  raw_data JSONB DEFAULT '{}',
  engagement_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Habilitar RLS
ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view their own Facebook posts" 
ON public.facebook_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Facebook posts" 
ON public.facebook_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Facebook posts" 
ON public.facebook_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Facebook posts" 
ON public.facebook_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear tabla linkedin_posts que también falta
CREATE TABLE IF NOT EXISTS public.linkedin_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id TEXT NOT NULL,
  post_type TEXT,
  content TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE,
  raw_data JSONB DEFAULT '{}',
  engagement_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Habilitar RLS para LinkedIn
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para LinkedIn
CREATE POLICY "Users can view their own LinkedIn posts" 
ON public.linkedin_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own LinkedIn posts" 
ON public.linkedin_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LinkedIn posts" 
ON public.linkedin_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own LinkedIn posts" 
ON public.linkedin_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Agregar constraint único a social_media_calendar para resolver ON CONFLICT
ALTER TABLE public.social_media_calendar 
ADD CONSTRAINT social_media_calendar_unique 
UNIQUE (user_id, platform, post_id);

-- Crear triggers para updated_at
CREATE TRIGGER update_facebook_posts_updated_at
BEFORE UPDATE ON public.facebook_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_linkedin_posts_updated_at
BEFORE UPDATE ON public.linkedin_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();