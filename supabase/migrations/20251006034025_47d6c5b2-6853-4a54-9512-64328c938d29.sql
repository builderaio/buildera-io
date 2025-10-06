-- Add unique constraint for upsert capability on social_content_analysis
ALTER TABLE social_content_analysis 
ADD CONSTRAINT social_content_analysis_user_platform_unique 
UNIQUE (user_id, platform);

-- Add index for better performance on queries by user and platform
CREATE INDEX IF NOT EXISTS idx_social_content_analysis_user_platform 
ON social_content_analysis(user_id, platform);