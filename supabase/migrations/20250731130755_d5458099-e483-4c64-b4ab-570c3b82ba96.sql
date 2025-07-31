-- Corregir constraint de marketing_insights para incluir todos los tipos de insight

ALTER TABLE marketing_insights DROP CONSTRAINT IF EXISTS marketing_insights_insight_type_check;

ALTER TABLE marketing_insights ADD CONSTRAINT marketing_insights_insight_type_check
CHECK (insight_type IN (
  'optimal_timing',
  'content_performance', 
  'sentiment_analysis',
  'hashtag_optimization',
  'performance_trends',
  'competitive_analysis',
  'audience_insights',
  'content_suggestions'
));