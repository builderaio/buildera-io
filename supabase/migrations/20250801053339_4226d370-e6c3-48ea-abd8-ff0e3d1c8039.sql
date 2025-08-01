-- Fix marketing_actionables constraint issues
-- Update the action_type constraint to include the new types
ALTER TABLE marketing_actionables DROP CONSTRAINT IF EXISTS marketing_actionables_action_type_check;

ALTER TABLE marketing_actionables ADD CONSTRAINT marketing_actionables_action_type_check 
CHECK (action_type IN (
  'content_creation', 
  'hashtag_optimization', 
  'posting_schedule', 
  'audience_engagement', 
  'strategic_premium',
  'performance_optimization',
  'competitive_analysis',
  'growth_strategy'
));

-- Add missing columns to marketing_insights if they don't exist
DO $$ 
BEGIN
  -- Check and add platforms column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'marketing_insights' AND column_name = 'platforms') THEN
    ALTER TABLE marketing_insights ADD COLUMN platforms TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_insights_user_type ON marketing_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_marketing_actionables_user_type ON marketing_actionables(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_user_platform ON instagram_posts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_calendar_user_platform ON social_media_calendar(user_id, platform);

-- Update RLS policies to ensure data access
DROP POLICY IF EXISTS "Users can view their own insights" ON marketing_insights;
CREATE POLICY "Users can view their own insights" ON marketing_insights
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own insights" ON marketing_insights;
CREATE POLICY "Users can insert their own insights" ON marketing_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);