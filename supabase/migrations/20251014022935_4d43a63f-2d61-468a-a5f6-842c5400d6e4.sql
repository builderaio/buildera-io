-- Create table to track completed content ideas
CREATE TABLE IF NOT EXISTS public.completed_content_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_idea_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.completed_content_ideas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own completed ideas"
  ON public.completed_content_ideas
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed ideas"
  ON public.completed_content_ideas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_completed_content_ideas_user_id 
  ON public.completed_content_ideas(user_id);

CREATE INDEX idx_completed_content_ideas_content_idea_id 
  ON public.completed_content_ideas(content_idea_id);