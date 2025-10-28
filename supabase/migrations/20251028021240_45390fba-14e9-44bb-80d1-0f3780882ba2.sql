-- Relax platform check to include additional platforms and multi-platform aggregate
ALTER TABLE public.audience_insights
DROP CONSTRAINT IF EXISTS audience_insights_platform_check;

ALTER TABLE public.audience_insights
ADD CONSTRAINT audience_insights_platform_check
CHECK (platform IN ('instagram','facebook','tiktok','linkedin','youtube','twitter','multi-platform'));

-- Ensure supporting index exists (kept for safety)
CREATE INDEX IF NOT EXISTS idx_audience_insights_user_platform_type 
ON public.audience_insights(user_id, platform, insight_type);