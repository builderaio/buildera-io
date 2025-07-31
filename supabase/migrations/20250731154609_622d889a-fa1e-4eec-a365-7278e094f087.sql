-- Create table for storing TikTok posts
CREATE TABLE public.tiktok_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tiktok_user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  aweme_id TEXT NOT NULL,
  title TEXT,
  cover_url TEXT,
  duration INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  digg_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  collect_count INTEGER DEFAULT 0,
  create_time BIGINT,
  posted_at TIMESTAMP WITH TIME ZONE,
  is_ad BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tiktok_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own TikTok posts" 
ON public.tiktok_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TikTok posts" 
ON public.tiktok_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TikTok posts" 
ON public.tiktok_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TikTok posts" 
ON public.tiktok_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_tiktok_posts_updated_at
BEFORE UPDATE ON public.tiktok_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();