-- Add unique constraint to social_activity_analysis table to prevent duplicates
ALTER TABLE public.social_activity_analysis 
ADD CONSTRAINT unique_social_activity_analysis 
UNIQUE (user_id, platform, cid);