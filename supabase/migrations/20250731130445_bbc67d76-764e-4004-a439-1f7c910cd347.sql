-- Primero verificar los constraint actuales de marketing_insights
-- y agregar el tipo faltante

-- Verificar constraint actual
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'marketing_insights'::regclass 
AND contype = 'c';

-- Agregar el tipo de insight faltante al constraint
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