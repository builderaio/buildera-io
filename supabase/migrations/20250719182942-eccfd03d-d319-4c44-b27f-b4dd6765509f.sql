-- Habilitar extensiones necesarias para vector store
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla para almacenar embeddings de contenido
CREATE TABLE IF NOT EXISTS public.content_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  platform TEXT NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimensiones
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id)
);

-- Tabla para gestión de jobs de procesamiento
CREATE TABLE IF NOT EXISTS public.data_processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  job_type TEXT NOT NULL, -- 'full_sync', 'incremental', 'embedding_generation'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- porcentaje 0-100
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para análisis semánticos avanzados
CREATE TABLE IF NOT EXISTS public.content_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cluster_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  content_theme TEXT NOT NULL,
  post_count INTEGER DEFAULT 0,
  avg_engagement NUMERIC DEFAULT 0,
  top_hashtags TEXT[] DEFAULT '{}',
  representative_posts UUID[] DEFAULT '{}',
  embedding_centroid vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para recomendaciones de contenido
CREATE TABLE IF NOT EXISTS public.content_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  recommendation_type TEXT NOT NULL, -- 'similar_content', 'trending_topics', 'optimal_timing'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 0,
  similar_post_ids UUID[] DEFAULT '{}',
  suggested_content JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active', -- 'active', 'implemented', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_content_embeddings_user_platform ON content_embeddings(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector ON content_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON data_processing_jobs(status, user_id);
CREATE INDEX IF NOT EXISTS idx_clusters_user_platform ON content_clusters(user_id, platform);

-- RLS para content_embeddings
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own embeddings" 
ON public.content_embeddings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embeddings" 
ON public.content_embeddings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings" 
ON public.content_embeddings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings" 
ON public.content_embeddings FOR DELETE 
USING (auth.uid() = user_id);

-- RLS para data_processing_jobs
ALTER TABLE public.data_processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs" 
ON public.data_processing_jobs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs" 
ON public.data_processing_jobs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" 
ON public.data_processing_jobs FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS para content_clusters
ALTER TABLE public.content_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clusters" 
ON public.content_clusters FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clusters" 
ON public.content_clusters FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clusters" 
ON public.content_clusters FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clusters" 
ON public.content_clusters FOR DELETE 
USING (auth.uid() = user_id);

-- RLS para content_recommendations
ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations" 
ON public.content_recommendations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations" 
ON public.content_recommendations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" 
ON public.content_recommendations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations" 
ON public.content_recommendations FOR DELETE 
USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_content_embeddings_updated_at
  BEFORE UPDATE ON public.content_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processing_jobs_updated_at
  BEFORE UPDATE ON public.data_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_clusters_updated_at
  BEFORE UPDATE ON public.content_clusters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_recommendations_updated_at
  BEFORE UPDATE ON public.content_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();