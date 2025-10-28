-- Add unique constraint to audience_insights table for upsert operations
ALTER TABLE public.audience_insights 
ADD CONSTRAINT audience_insights_user_platform_type_unique 
UNIQUE (user_id, platform, insight_type);