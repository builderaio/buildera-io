-- Drop table if exists to start fresh
DROP TABLE IF EXISTS public.content_insights CASCADE;

-- Create content_insights table for persistent insight management
CREATE TABLE public.content_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  strategy TEXT,
  format TEXT,
  platform TEXT,
  hashtags TEXT[],
  timing TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  source_analysis_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_content_insights_user_id ON public.content_insights(user_id);
CREATE INDEX idx_content_insights_status ON public.content_insights(user_id, status);
CREATE INDEX idx_content_insights_type ON public.content_insights(user_id, insight_type);
CREATE INDEX idx_content_insights_generated_at ON public.content_insights(user_id, generated_at DESC);

-- Enable RLS
ALTER TABLE public.content_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own insights"
  ON public.content_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON public.content_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON public.content_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON public.content_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_content_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_content_insights_updated_at
  BEFORE UPDATE ON public.content_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_content_insights_updated_at();