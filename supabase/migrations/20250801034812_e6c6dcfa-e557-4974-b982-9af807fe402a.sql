-- Actualizar el constraint de metric_type para incluir todos los tipos que se están usando
ALTER TABLE public.social_media_analytics 
DROP CONSTRAINT social_media_analytics_metric_type_check;

ALTER TABLE public.social_media_analytics 
ADD CONSTRAINT social_media_analytics_metric_type_check 
CHECK (metric_type = ANY (ARRAY[
  'engagement_rate'::text, 
  'reach'::text, 
  'impressions'::text, 
  'followers_growth'::text, 
  'best_posting_time'::text, 
  'top_hashtags'::text,
  'total_posts'::text,
  'total_likes'::text,
  'total_comments'::text,
  'avg_engagement_rate'::text,
  'total_views'::text,
  'total_shares'::text
]));