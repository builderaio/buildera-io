-- Create table for social content analysis
CREATE TABLE IF NOT EXISTS public.social_content_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  cid TEXT NOT NULL,
  analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  posts_analyzed INTEGER NOT NULL DEFAULT 0,
  posts_data JSONB,
  summary_data JSONB,
  raw_api_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.social_content_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own content analysis" 
ON public.social_content_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content analysis" 
ON public.social_content_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content analysis" 
ON public.social_content_analysis 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content analysis" 
ON public.social_content_analysis 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_content_analysis_updated_at
BEFORE UPDATE ON public.social_content_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_trigger();

-- Create index for better performance
CREATE INDEX idx_social_content_analysis_user_platform ON public.social_content_analysis(user_id, platform);
CREATE INDEX idx_social_content_analysis_cid ON public.social_content_analysis(cid);
CREATE INDEX idx_social_content_analysis_period ON public.social_content_analysis(analysis_period_start, analysis_period_end);