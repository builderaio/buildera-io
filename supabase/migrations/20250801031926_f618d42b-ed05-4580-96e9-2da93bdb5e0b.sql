-- Crear tabla social_media_analytics para almacenar métricas calculadas
CREATE TABLE IF NOT EXISTS public.social_media_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.social_media_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own analytics" ON public.social_media_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON public.social_media_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" ON public.social_media_analytics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics" ON public.social_media_analytics
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_social_media_analytics_user_platform 
  ON public.social_media_analytics(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_media_analytics_period 
  ON public.social_media_analytics(period_start, period_end);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_social_media_analytics_updated_at
  BEFORE UPDATE ON public.social_media_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();