-- Add column to store the full AI analysis data for competitors
ALTER TABLE public.company_competitors 
ADD COLUMN IF NOT EXISTS ai_analysis jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_analyzed_at timestamp with time zone DEFAULT NULL;