-- Fix database schema issues for advanced marketing analysis

-- Add missing columns to marketing_insights table
ALTER TABLE public.marketing_insights 
ADD COLUMN IF NOT EXISTS platform text,
ADD COLUMN IF NOT EXISTS generated_by text DEFAULT 'ai';

-- Update marketing_actionables action_type constraint to include all existing and new types
ALTER TABLE public.marketing_actionables 
DROP CONSTRAINT IF EXISTS marketing_actionables_action_type_check;

ALTER TABLE public.marketing_actionables 
ADD CONSTRAINT marketing_actionables_action_type_check 
CHECK (action_type IN (
  'content_optimization', 
  'timing_optimization', 
  'hashtag_optimization', 
  'engagement_boost', 
  'audience_growth', 
  'content_creation',
  'platform_strategy',
  'competitive_analysis',
  'performance_tracking',
  'social_listening',
  'posting_schedule'
));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_insights_platform ON public.marketing_insights(platform);
CREATE INDEX IF NOT EXISTS idx_marketing_insights_user_platform ON public.marketing_insights(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_marketing_actionables_status ON public.marketing_actionables(status);
CREATE INDEX IF NOT EXISTS idx_social_media_calendar_user_platform ON public.social_media_calendar(user_id, platform);