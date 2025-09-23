-- Create unique constraint for social_content_analysis table to enable upsert functionality
CREATE UNIQUE INDEX idx_social_content_analysis_unique 
ON public.social_content_analysis (user_id, platform, cid);

-- This will allow the edge function to properly upsert data without conflicts