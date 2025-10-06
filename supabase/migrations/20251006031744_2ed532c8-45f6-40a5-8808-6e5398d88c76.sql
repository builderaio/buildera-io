-- Limpiar duplicados en social_analysis manteniendo solo el registro más reciente por usuario y tipo de red social
WITH duplicates_to_delete AS (
  SELECT id
  FROM social_analysis
  WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, social_type) id
    FROM social_analysis
    ORDER BY user_id, social_type, created_at DESC
  )
)
DELETE FROM social_analysis
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Crear índice único para prevenir duplicados futuros
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_analysis_user_type 
ON social_analysis(user_id, social_type);

-- Comentario
COMMENT ON INDEX idx_social_analysis_user_type IS 'Índice único que previene duplicados de análisis por usuario y tipo de red social';