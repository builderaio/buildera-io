-- Create table for social retrospective analysis
CREATE TABLE IF NOT EXISTS public.social_retrospective_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  cid TEXT NOT NULL,
  analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  current_followers INTEGER NOT NULL DEFAULT 0,
  followers_growth INTEGER NOT NULL DEFAULT 0,
  total_posts INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  total_likes INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,
  average_er NUMERIC(10,4) NOT NULL DEFAULT 0,
  quality_score NUMERIC(10,4) NOT NULL DEFAULT 0,
  avg_posts_per_week NUMERIC(10,4) NOT NULL DEFAULT 0,
  series_data JSONB,
  summary_data JSONB,
  raw_api_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.social_retrospective_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own retrospective analysis" 
ON public.social_retrospective_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own retrospective analysis" 
ON public.social_retrospective_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own retrospective analysis" 
ON public.social_retrospective_analysis 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own retrospective analysis" 
ON public.social_retrospective_analysis 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_retrospective_analysis_updated_at
BEFORE UPDATE ON public.social_retrospective_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_trigger();

-- Create indexes for better performance
CREATE INDEX idx_social_retrospective_analysis_user_platform ON public.social_retrospective_analysis(user_id, platform);
CREATE INDEX idx_social_retrospective_analysis_cid ON public.social_retrospective_analysis(cid);
CREATE INDEX idx_social_retrospective_analysis_period ON public.social_retrospective_analysis(analysis_period_start, analysis_period_end);