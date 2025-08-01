-- Crear tabla facebook_posts para almacenar posts de Facebook
CREATE TABLE public.facebook_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id TEXT NOT NULL,
  post_type TEXT,
  content TEXT,
  author_name TEXT,
  author_id TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Habilitar RLS
ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para facebook_posts
CREATE POLICY "Users can view their own Facebook posts"
  ON public.facebook_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Facebook posts"
  ON public.facebook_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Facebook posts"
  ON public.facebook_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Facebook posts"
  ON public.facebook_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Añadir trigger para updated_at
CREATE TRIGGER update_facebook_posts_updated_at
  BEFORE UPDATE ON public.facebook_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();