-- Create content insights table
CREATE TABLE IF NOT EXISTS public.content_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  format_type TEXT, -- 'post', 'video', 'carousel', etc.
  platform TEXT, -- 'instagram', 'linkedin', 'tiktok', etc.
  hashtags TEXT[], -- Array of hashtags
  suggested_schedule TEXT, -- When to publish
  raw_insight TEXT, -- Full AI response
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own content insights" 
ON public.content_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content insights" 
ON public.content_insights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content insights" 
ON public.content_insights 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content insights" 
ON public.content_insights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create generated content table
CREATE TABLE IF NOT EXISTS public.generated_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES public.content_insights(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'video'
  media_url TEXT, -- URL for generated images/videos
  generation_prompt TEXT, -- Original prompt used
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for generated content
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

-- Create policies for generated content
CREATE POLICY "Users can view their own generated content" 
ON public.generated_content 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generated content" 
ON public.generated_content 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated content" 
ON public.generated_content 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated content" 
ON public.generated_content 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_insights_updated_at 
  BEFORE UPDATE ON public.content_insights 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at 
  BEFORE UPDATE ON public.generated_content 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();