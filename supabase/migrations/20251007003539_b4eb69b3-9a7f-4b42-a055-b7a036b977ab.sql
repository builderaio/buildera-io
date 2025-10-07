-- Add AI-generated insights columns to audience_insights table
ALTER TABLE public.audience_insights 
ADD COLUMN IF NOT EXISTS ai_generated_insights JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS audience_segments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_ai_analysis_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for better performance on AI analysis lookups
CREATE INDEX IF NOT EXISTS idx_audience_insights_user_platform 
ON public.audience_insights(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_audience_insights_last_ai_analysis 
ON public.audience_insights(last_ai_analysis_at DESC);

-- Comment on new columns
COMMENT ON COLUMN public.audience_insights.ai_generated_insights IS 'AI-generated detailed insights about the audience';
COMMENT ON COLUMN public.audience_insights.ai_recommendations IS 'AI-generated recommendations based on audience analysis';
COMMENT ON COLUMN public.audience_insights.audience_segments IS 'AI-identified audience segments with characteristics';
COMMENT ON COLUMN public.audience_insights.last_ai_analysis_at IS 'Timestamp of the last AI analysis';