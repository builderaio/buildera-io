-- Create table for TikTok user data from scraping
CREATE TABLE public.tiktok_user_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tiktok_user_id TEXT NOT NULL,
  unique_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  heart_count INTEGER DEFAULT 0,
  signature TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tiktok_user_id)
);

-- Create table for TikTok followers data
CREATE TABLE public.tiktok_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tiktok_user_id TEXT NOT NULL,
  follower_user_id TEXT NOT NULL,
  follower_unique_id TEXT,
  follower_nickname TEXT,
  follower_count INTEGER DEFAULT 0,
  avatar_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tiktok_user_id, follower_user_id)
);

-- Create table for TikTok following data
CREATE TABLE public.tiktok_following (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tiktok_user_id TEXT NOT NULL,
  following_user_id TEXT NOT NULL,
  following_unique_id TEXT,
  following_nickname TEXT,
  follower_count INTEGER DEFAULT 0,
  avatar_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tiktok_user_id, following_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.tiktok_user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_following ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tiktok_user_data
CREATE POLICY "Users can view their own TikTok user data" 
ON public.tiktok_user_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TikTok user data" 
ON public.tiktok_user_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TikTok user data" 
ON public.tiktok_user_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TikTok user data" 
ON public.tiktok_user_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for tiktok_followers
CREATE POLICY "Users can view their own TikTok followers" 
ON public.tiktok_followers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TikTok followers" 
ON public.tiktok_followers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TikTok followers" 
ON public.tiktok_followers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TikTok followers" 
ON public.tiktok_followers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for tiktok_following
CREATE POLICY "Users can view their own TikTok following" 
ON public.tiktok_following 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TikTok following" 
ON public.tiktok_following 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TikTok following" 
ON public.tiktok_following 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TikTok following" 
ON public.tiktok_following 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_tiktok_user_data_user_id ON public.tiktok_user_data(user_id);
CREATE INDEX idx_tiktok_followers_user_id ON public.tiktok_followers(user_id);
CREATE INDEX idx_tiktok_following_user_id ON public.tiktok_following(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_tiktok_user_data_updated_at
  BEFORE UPDATE ON public.tiktok_user_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();