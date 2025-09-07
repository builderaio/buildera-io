-- Create content library table for saving successful posts as templates
CREATE TABLE IF NOT EXISTS public.content_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id TEXT,
  platform TEXT NOT NULL,
  content_type TEXT DEFAULT 'post',
  content_text TEXT,
  image_url TEXT,
  video_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  post_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  is_template BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own content library"
ON public.content_library
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content library"
ON public.content_library
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content library"
ON public.content_library
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content library"
ON public.content_library
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_content_library_user_id ON public.content_library(user_id);
CREATE INDEX idx_content_library_platform ON public.content_library(platform);
CREATE INDEX idx_content_library_is_template ON public.content_library(is_template);

-- Create updated_at trigger
CREATE TRIGGER update_content_library_updated_at
BEFORE UPDATE ON public.content_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_trigger();