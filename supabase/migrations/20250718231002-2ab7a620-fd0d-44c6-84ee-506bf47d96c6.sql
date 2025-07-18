-- Create table for TikTok connections
CREATE TABLE public.tiktok_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  scope TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  tiktok_user_id TEXT NOT NULL,
  user_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tiktok_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own TikTok connections" 
ON public.tiktok_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own TikTok connections" 
ON public.tiktok_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TikTok connections" 
ON public.tiktok_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TikTok connections" 
ON public.tiktok_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for TikTok publications
CREATE TABLE public.tiktok_publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tiktok_user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  content_data JSONB NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for publications
ALTER TABLE public.tiktok_publications ENABLE ROW LEVEL SECURITY;

-- Create policies for publications
CREATE POLICY "Users can view their own TikTok publications" 
ON public.tiktok_publications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own TikTok publications" 
ON public.tiktok_publications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on tiktok_connections
CREATE TRIGGER update_tiktok_connections_updated_at
BEFORE UPDATE ON public.tiktok_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();