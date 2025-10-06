-- Agregar campos faltantes a la tabla facebook_posts
ALTER TABLE public.facebook_posts
ADD COLUMN IF NOT EXISTS cid TEXT,
ADD COLUMN IF NOT EXISTS data_id TEXT,
ADD COLUMN IF NOT EXISTS from_owner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hashtags TEXT[],
ADD COLUMN IF NOT EXISTS mentions TEXT[],
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_views_count INTEGER,
ADD COLUMN IF NOT EXISTS index_grade NUMERIC,
ADD COLUMN IF NOT EXISTS main_grade TEXT,
ADD COLUMN IF NOT EXISTS is_ad BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS interactions_count INTEGER,
ADD COLUMN IF NOT EXISTS time_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS post_url TEXT,
ADD COLUMN IF NOT EXISTS post_image_url TEXT,
ADD COLUMN IF NOT EXISTS social_post_id TEXT,
ADD COLUMN IF NOT EXISTS text_length INTEGER;

-- Agregar campos faltantes a la tabla instagram_posts
ALTER TABLE public.instagram_posts
ADD COLUMN IF NOT EXISTS cid TEXT,
ADD COLUMN IF NOT EXISTS data_id TEXT,
ADD COLUMN IF NOT EXISTS from_owner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS index_grade NUMERIC,
ADD COLUMN IF NOT EXISTS main_grade TEXT,
ADD COLUMN IF NOT EXISTS is_ad BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS interactions_count INTEGER,
ADD COLUMN IF NOT EXISTS time_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS post_url TEXT,
ADD COLUMN IF NOT EXISTS post_image_url TEXT,
ADD COLUMN IF NOT EXISTS social_post_id TEXT,
ADD COLUMN IF NOT EXISTS text_length INTEGER,
ADD COLUMN IF NOT EXISTS reel_plays INTEGER,
ADD COLUMN IF NOT EXISTS video_plays INTEGER;

-- Agregar campos faltantes a la tabla linkedin_posts
ALTER TABLE public.linkedin_posts
ADD COLUMN IF NOT EXISTS cid TEXT,
ADD COLUMN IF NOT EXISTS data_id TEXT,
ADD COLUMN IF NOT EXISTS from_owner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hashtags TEXT[],
ADD COLUMN IF NOT EXISTS mentions TEXT[],
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS index_grade NUMERIC,
ADD COLUMN IF NOT EXISTS main_grade TEXT,
ADD COLUMN IF NOT EXISTS is_ad BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS interactions_count INTEGER,
ADD COLUMN IF NOT EXISTS time_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS post_url TEXT,
ADD COLUMN IF NOT EXISTS post_image_url TEXT,
ADD COLUMN IF NOT EXISTS social_post_id TEXT,
ADD COLUMN IF NOT EXISTS text_length INTEGER,
ADD COLUMN IF NOT EXISTS impressions_count INTEGER,
ADD COLUMN IF NOT EXISTS click_count INTEGER;

-- Agregar campos faltantes a la tabla tiktok_posts
ALTER TABLE public.tiktok_posts
ADD COLUMN IF NOT EXISTS cid TEXT,
ADD COLUMN IF NOT EXISTS data_id TEXT,
ADD COLUMN IF NOT EXISTS from_owner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hashtags TEXT[],
ADD COLUMN IF NOT EXISTS mentions TEXT[],
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS index_grade NUMERIC,
ADD COLUMN IF NOT EXISTS main_grade TEXT,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS interactions_count INTEGER,
ADD COLUMN IF NOT EXISTS time_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS post_url TEXT,
ADD COLUMN IF NOT EXISTS post_image_url TEXT,
ADD COLUMN IF NOT EXISTS social_post_id TEXT,
ADD COLUMN IF NOT EXISTS text_length INTEGER,
ADD COLUMN IF NOT EXISTS forward_count INTEGER,
ADD COLUMN IF NOT EXISTS whatsapp_share_count INTEGER,
ADD COLUMN IF NOT EXISTS content TEXT;

-- Crear índices para mejorar el rendimiento de búsqueda
CREATE INDEX IF NOT EXISTS idx_facebook_posts_cid ON public.facebook_posts(cid);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_user_posted ON public.facebook_posts(user_id, posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_cid ON public.instagram_posts(cid);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_user_posted ON public.instagram_posts(user_id, posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_linkedin_posts_cid ON public.linkedin_posts(cid);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user_posted ON public.linkedin_posts(user_id, posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_tiktok_posts_cid ON public.tiktok_posts(cid);
CREATE INDEX IF NOT EXISTS idx_tiktok_posts_user_posted ON public.tiktok_posts(user_id, posted_at DESC);