-- Crear tabla para almacenar posts de Instagram
CREATE TABLE public.instagram_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  post_id TEXT NOT NULL,
  shortcode TEXT,
  caption TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  media_type INTEGER DEFAULT 1, -- 1: image, 2: video, 8: carousel
  is_video BOOLEAN DEFAULT false,
  video_view_count INTEGER DEFAULT 0,
  display_url TEXT,
  thumbnail_url TEXT,
  taken_at_timestamp BIGINT,
  posted_at TIMESTAMP WITH TIME ZONE,
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  owner_username TEXT,
  owner_full_name TEXT,
  owner_profile_pic_url TEXT,
  raw_data JSONB DEFAULT '{}',
  engagement_rate NUMERIC DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view their own Instagram posts"
ON public.instagram_posts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Instagram posts"
ON public.instagram_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Instagram posts"
ON public.instagram_posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Instagram posts"
ON public.instagram_posts
FOR DELETE
USING (auth.uid() = user_id);

-- Crear índices para optimizar consultas
CREATE INDEX idx_instagram_posts_user_id ON public.instagram_posts(user_id);
CREATE INDEX idx_instagram_posts_platform ON public.instagram_posts(platform);
CREATE INDEX idx_instagram_posts_posted_at ON public.instagram_posts(posted_at DESC);
CREATE INDEX idx_instagram_posts_engagement ON public.instagram_posts(engagement_rate DESC);
CREATE UNIQUE INDEX idx_instagram_posts_user_post ON public.instagram_posts(user_id, post_id);

-- Crear tabla para análisis de contenido de Instagram
CREATE TABLE public.instagram_content_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
  sentiment_score NUMERIC DEFAULT 0, -- -1 a 1
  sentiment_label TEXT, -- positive, negative, neutral
  topics TEXT[] DEFAULT '{}',
  visual_elements TEXT[] DEFAULT '{}',
  text_complexity_score NUMERIC DEFAULT 0,
  brand_mentions TEXT[] DEFAULT '{}',
  competitor_mentions TEXT[] DEFAULT '{}',
  trending_keywords TEXT[] DEFAULT '{}',
  content_category TEXT,
  optimal_posting_time TIMESTAMP WITH TIME ZONE,
  engagement_prediction NUMERIC DEFAULT 0,
  virality_score NUMERIC DEFAULT 0,
  ai_generated_tags TEXT[] DEFAULT '{}',
  content_quality_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para análisis de contenido
ALTER TABLE public.instagram_content_analysis ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para análisis
CREATE POLICY "Users can view their own content analysis"
ON public.instagram_content_analysis
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content analysis"
ON public.instagram_content_analysis
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content analysis"
ON public.instagram_content_analysis
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content analysis"
ON public.instagram_content_analysis
FOR DELETE
USING (auth.uid() = user_id);

-- Crear índices para análisis de contenido
CREATE INDEX idx_instagram_analysis_user_id ON public.instagram_content_analysis(user_id);
CREATE INDEX idx_instagram_analysis_post_id ON public.instagram_content_analysis(post_id);
CREATE INDEX idx_instagram_analysis_sentiment ON public.instagram_content_analysis(sentiment_score DESC);
CREATE INDEX idx_instagram_analysis_engagement_pred ON public.instagram_content_analysis(engagement_prediction DESC);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_instagram_posts_updated_at
BEFORE UPDATE ON public.instagram_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instagram_analysis_updated_at
BEFORE UPDATE ON public.instagram_content_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Extender la tabla content_embeddings para mejor soporte de Instagram
ALTER TABLE public.content_embeddings 
ADD COLUMN IF NOT EXISTS instagram_post_id UUID REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'caption',
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-3-small',
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

-- Crear índice para la nueva columna
CREATE INDEX IF NOT EXISTS idx_content_embeddings_instagram_post 
ON public.content_embeddings(instagram_post_id);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_status 
ON public.content_embeddings(processing_status);

-- Crear función para calcular engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate(likes INTEGER, comments INTEGER, followers INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
  IF followers = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(((likes + comments)::NUMERIC / followers::NUMERIC) * 100, 2);
END;
$$;

-- Crear función para extraer hashtags del caption
CREATE OR REPLACE FUNCTION extract_hashtags(caption TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  hashtags TEXT[];
BEGIN
  IF caption IS NULL THEN
    RETURN '{}';
  END IF;
  
  SELECT array_agg(DISTINCT LOWER(hashtag))
  INTO hashtags
  FROM (
    SELECT regexp_replace(unnest(regexp_split_to_array(caption, '#')), '^([a-zA-Z0-9_]+).*', '\1') as hashtag
  ) t
  WHERE hashtag != '' AND hashtag != caption;
  
  RETURN COALESCE(hashtags, '{}');
END;
$$;

-- Crear función para extraer menciones del caption
CREATE OR REPLACE FUNCTION extract_mentions(caption TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  mentions TEXT[];
BEGIN
  IF caption IS NULL THEN
    RETURN '{}';
  END IF;
  
  SELECT array_agg(DISTINCT LOWER(mention))
  INTO mentions
  FROM (
    SELECT regexp_replace(unnest(regexp_split_to_array(caption, '@')), '^([a-zA-Z0-9_.]+).*', '\1') as mention
  ) t
  WHERE mention != '' AND mention != caption;
  
  RETURN COALESCE(mentions, '{}');
END;
$$;