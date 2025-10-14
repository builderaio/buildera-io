-- Agregar columnas a content_insights para tracking mejorado
ALTER TABLE content_insights 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai_generated',
ADD COLUMN IF NOT EXISTS has_generated_content BOOLEAN DEFAULT false;

-- Agregar columnas a generated_content para estado de publicación
ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS publication_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Comentarios para documentación
COMMENT ON COLUMN content_insights.source IS 'Origen del insight: ai_generated o user_created';
COMMENT ON COLUMN content_insights.has_generated_content IS 'Indica si se ha generado contenido basado en este insight';
COMMENT ON COLUMN generated_content.publication_status IS 'Estado de publicación: draft, published, scheduled';
COMMENT ON COLUMN generated_content.published_at IS 'Fecha y hora de publicación del contenido';