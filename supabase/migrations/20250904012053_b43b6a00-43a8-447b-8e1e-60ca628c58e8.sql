-- Crear tabla para almacenar conexiones de redes sociales con Upload-Post
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID,
  company_username TEXT NOT NULL,
  upload_post_profile_exists BOOLEAN DEFAULT false,
  platform TEXT NOT NULL, -- 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'twitter', 'threads', 'pinterest'
  platform_username TEXT,
  platform_display_name TEXT,
  is_connected BOOLEAN DEFAULT false,
  facebook_page_id TEXT, -- Para casos especiales de Facebook
  access_token TEXT, -- Para tokens específicos de plataforma si es necesario
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, platform)
);

-- Habilitar RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can manage their own social accounts"
ON public.social_accounts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Crear tabla para trabajos programados de Upload-Post
CREATE TABLE public.scheduled_social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_username TEXT NOT NULL,
  job_id TEXT NOT NULL, -- ID del trabajo en Upload-Post
  platforms TEXT[] NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  media_urls TEXT[],
  post_type TEXT NOT NULL, -- 'text', 'photo', 'video'
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'published', 'failed', 'cancelled'
  preview_url TEXT,
  upload_post_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para scheduled_social_posts
ALTER TABLE public.scheduled_social_posts ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para scheduled_social_posts
CREATE POLICY "Users can manage their own scheduled posts"
ON public.scheduled_social_posts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at en social_accounts
CREATE OR REPLACE FUNCTION update_social_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_social_accounts_updated_at();

-- Trigger para updated_at en scheduled_social_posts
CREATE OR REPLACE FUNCTION update_scheduled_social_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scheduled_social_posts_updated_at
  BEFORE UPDATE ON public.scheduled_social_posts
  FOR EACH ROW EXECUTE FUNCTION update_scheduled_social_posts_updated_at();