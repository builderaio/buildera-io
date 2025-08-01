-- Eliminar tablas redundantes e innecesarias
DROP TABLE IF EXISTS public.instagram_publications CASCADE;
DROP TABLE IF EXISTS public.tiktok_publications CASCADE;
DROP TABLE IF EXISTS public.social_media_posts CASCADE;
DROP TABLE IF EXISTS public.instagram_user_profiles CASCADE;
DROP TABLE IF EXISTS public.facebook_page_profiles CASCADE;
DROP TABLE IF EXISTS public.linkedin_profiles CASCADE;

-- Añadir campos de perfil a las tablas de posts existentes
-- Instagram posts: añadir info del perfil
ALTER TABLE public.instagram_posts ADD COLUMN IF NOT EXISTS profile_username TEXT;
ALTER TABLE public.instagram_posts ADD COLUMN IF NOT EXISTS profile_full_name TEXT;
ALTER TABLE public.instagram_posts ADD COLUMN IF NOT EXISTS profile_followers_count INTEGER DEFAULT 0;
ALTER TABLE public.instagram_posts ADD COLUMN IF NOT EXISTS profile_following_count INTEGER DEFAULT 0;
ALTER TABLE public.instagram_posts ADD COLUMN IF NOT EXISTS profile_is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.instagram_posts ADD COLUMN IF NOT EXISTS profile_is_business BOOLEAN DEFAULT false;
ALTER TABLE public.instagram_posts ADD COLUMN IF NOT EXISTS profile_pic_url TEXT;

-- TikTok posts: añadir info del perfil  
ALTER TABLE public.tiktok_posts ADD COLUMN IF NOT EXISTS profile_username TEXT;
ALTER TABLE public.tiktok_posts ADD COLUMN IF NOT EXISTS profile_display_name TEXT;
ALTER TABLE public.tiktok_posts ADD COLUMN IF NOT EXISTS profile_followers_count INTEGER DEFAULT 0;
ALTER TABLE public.tiktok_posts ADD COLUMN IF NOT EXISTS profile_following_count INTEGER DEFAULT 0;
ALTER TABLE public.tiktok_posts ADD COLUMN IF NOT EXISTS profile_is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.tiktok_posts ADD COLUMN IF NOT EXISTS profile_avatar_url TEXT;

-- LinkedIn posts: añadir info del perfil
ALTER TABLE public.linkedin_posts ADD COLUMN IF NOT EXISTS profile_name TEXT;
ALTER TABLE public.linkedin_posts ADD COLUMN IF NOT EXISTS profile_headline TEXT;
ALTER TABLE public.linkedin_posts ADD COLUMN IF NOT EXISTS profile_followers_count INTEGER DEFAULT 0;
ALTER TABLE public.linkedin_posts ADD COLUMN IF NOT EXISTS profile_industry TEXT;
ALTER TABLE public.linkedin_posts ADD COLUMN IF NOT EXISTS profile_location TEXT;
ALTER TABLE public.linkedin_posts ADD COLUMN IF NOT EXISTS profile_url TEXT;

-- Facebook posts: añadir info del perfil
ALTER TABLE public.facebook_posts ADD COLUMN IF NOT EXISTS profile_page_name TEXT;
ALTER TABLE public.facebook_posts ADD COLUMN IF NOT EXISTS profile_page_id TEXT;
ALTER TABLE public.facebook_posts ADD COLUMN IF NOT EXISTS profile_followers_count INTEGER DEFAULT 0;
ALTER TABLE public.facebook_posts ADD COLUMN IF NOT EXISTS profile_likes_count INTEGER DEFAULT 0;
ALTER TABLE public.facebook_posts ADD COLUMN IF NOT EXISTS profile_category TEXT;
ALTER TABLE public.facebook_posts ADD COLUMN IF NOT EXISTS profile_website TEXT;