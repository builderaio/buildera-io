-- Crear tabla para posts de Facebook
CREATE TABLE IF NOT EXISTS public.facebook_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id TEXT NOT NULL,
  content TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  post_type TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  raw_data JSONB DEFAULT '{}',
  engagement_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
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