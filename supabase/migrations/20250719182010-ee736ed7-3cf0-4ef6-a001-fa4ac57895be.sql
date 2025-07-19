-- Crear tabla para almacenar posts de redes sociales
CREATE TABLE public.social_media_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'tiktok')),
  platform_post_id TEXT NOT NULL,
  post_type TEXT CHECK (post_type IN ('post', 'video', 'image', 'carousel', 'story')),
  content TEXT,
  media_urls TEXT[],
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metrics JSONB DEFAULT '{}',
  hashtags TEXT[],
  mentions TEXT[],
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, platform_post_id)
);

-- Crear tabla para comentarios
CREATE TABLE public.social_media_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID REFERENCES public.social_media_posts(id) ON DELETE CASCADE,
  platform_comment_id TEXT NOT NULL,
  author_name TEXT,
  author_id TEXT,
  content TEXT NOT NULL,
  sentiment_score DECIMAL(3,2), -- -1 to 1
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform_comment_id)
);

-- Crear tabla para insights generados por IA
CREATE TABLE public.marketing_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('engagement', 'content_performance', 'audience_behavior', 'optimal_timing', 'hashtag_analysis', 'sentiment_analysis')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high')),
  platforms TEXT[] NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para accionables/recomendaciones
CREATE TABLE public.marketing_actionables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_id UUID REFERENCES public.marketing_insights(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('content_creation', 'posting_schedule', 'hashtag_optimization', 'engagement_strategy', 'audience_targeting')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_impact TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para métricas agregadas
CREATE TABLE public.social_media_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('engagement_rate', 'reach', 'impressions', 'followers_growth', 'best_posting_time', 'top_hashtags')),
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  value DECIMAL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, metric_type, period_type, period_start)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_actionables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_analytics ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view their own posts" ON public.social_media_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own posts" ON public.social_media_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.social_media_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.social_media_posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own comments" ON public.social_media_comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own comments" ON public.social_media_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.social_media_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.social_media_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own insights" ON public.marketing_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own insights" ON public.marketing_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insights" ON public.marketing_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insights" ON public.marketing_insights FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own actionables" ON public.marketing_actionables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own actionables" ON public.marketing_actionables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own actionables" ON public.marketing_actionables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own actionables" ON public.marketing_actionables FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics" ON public.social_media_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analytics" ON public.social_media_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analytics" ON public.social_media_analytics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analytics" ON public.social_media_analytics FOR DELETE USING (auth.uid() = user_id);

-- Crear triggers para updated_at
CREATE TRIGGER update_social_media_posts_updated_at
  BEFORE UPDATE ON public.social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_insights_updated_at
  BEFORE UPDATE ON public.marketing_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_actionables_updated_at
  BEFORE UPDATE ON public.marketing_actionables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();