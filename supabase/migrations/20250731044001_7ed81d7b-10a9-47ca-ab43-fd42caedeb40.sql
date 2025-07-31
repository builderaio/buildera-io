-- Corregir problemas de seguridad de las funciones creadas
-- Recrear función para calcular engagement rate con search_path seguro
CREATE OR REPLACE FUNCTION calculate_engagement_rate(likes INTEGER, comments INTEGER, followers INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF followers = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(((likes + comments)::NUMERIC / followers::NUMERIC) * 100, 2);
END;
$$;

-- Recrear función para extraer hashtags con search_path seguro
CREATE OR REPLACE FUNCTION extract_hashtags(caption TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  hashtags TEXT[];
BEGIN
  IF caption IS NULL THEN
    RETURN '{}';
  END IF;
  
  SELECT array_agg(DISTINCT LOWER(hashtag))
  INTO hashtags
  FROM (
    SELECT regexp_replace(unnest(regexp_split_to_array(caption, '#')), '^([a-zA-Z0-9_]+).*', '\1') as hashtag
  ) t
  WHERE hashtag != '' AND hashtag != caption;
  
  RETURN COALESCE(hashtags, '{}');
END;
$$;

-- Recrear función para extraer menciones con search_path seguro
CREATE OR REPLACE FUNCTION extract_mentions(caption TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  mentions TEXT[];
BEGIN
  IF caption IS NULL THEN
    RETURN '{}';
  END IF;
  
  SELECT array_agg(DISTINCT LOWER(mention))
  INTO mentions
  FROM (
    SELECT regexp_replace(unnest(regexp_split_to_array(caption, '@')), '^([a-zA-Z0-9_.]+).*', '\1') as mention
  ) t
  WHERE mention != '' AND mention != caption;
  
  RETURN COALESCE(mentions, '{}');
END;
$$;