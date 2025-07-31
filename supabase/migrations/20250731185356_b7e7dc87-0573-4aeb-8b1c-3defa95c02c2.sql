-- Crear tablas para capturar información más detallada de seguidores
-- que incluya ubicación geográfica y datos demográficos

-- Tabla para almacenar información detallada de seguidores de Instagram
CREATE TABLE IF NOT EXISTS public.instagram_followers_detailed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instagram_user_id TEXT NOT NULL,
  follower_user_id TEXT NOT NULL,
  follower_username TEXT,
  follower_full_name TEXT,
  follower_profile_pic_url TEXT,
  follower_is_verified BOOLEAN DEFAULT FALSE,
  follower_is_private BOOLEAN DEFAULT FALSE,
  follower_bio TEXT,
  follower_external_url TEXT,
  follower_business_category TEXT,
  follower_followers_count INTEGER DEFAULT 0,
  follower_following_count INTEGER DEFAULT 0,
  follower_media_count INTEGER DEFAULT 0,
  -- Información geográfica y demográfica
  follower_location TEXT,
  follower_country TEXT,
  follower_city TEXT,
  follower_language TEXT,
  follower_timezone TEXT,
  -- Análisis de actividad
  follower_engagement_rate NUMERIC DEFAULT 0,
  follower_avg_likes INTEGER DEFAULT 0,
  follower_avg_comments INTEGER DEFAULT 0,
  follower_last_activity TIMESTAMP WITH TIME ZONE,
  -- Datos brutos para análisis avanzado
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para el calendario de publicaciones de todas las redes sociales
CREATE TABLE IF NOT EXISTS public.social_media_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin')),
  post_id TEXT NOT NULL,
  post_type TEXT, -- 'image', 'video', 'carousel', 'reel', 'story'
  post_title TEXT,
  post_caption TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  -- Métricas de engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  -- Análisis temporal
  day_of_week INTEGER, -- 1-7 (Lunes-Domingo)
  hour_of_day INTEGER, -- 0-23
  time_zone TEXT DEFAULT 'UTC',
  -- Análisis de contenido
  hashtags TEXT[],
  mentions TEXT[],
  has_location BOOLEAN DEFAULT FALSE,
  location_name TEXT,
  -- Rendimiento comparativo
  engagement_rate NUMERIC DEFAULT 0,
  performance_score NUMERIC DEFAULT 0,
  -- Datos específicos por plataforma
  platform_specific_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para análisis de ubicaciones de seguidores
CREATE TABLE IF NOT EXISTS public.followers_location_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin')),
  -- Ubicación
  country TEXT NOT NULL,
  country_code TEXT, -- ISO 3166-1 alpha-2
  region TEXT,
  city TEXT,
  coordinates POINT, -- Para mapas
  -- Estadísticas
  followers_count INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  -- Datos demográficos
  avg_age NUMERIC,
  gender_distribution JSONB, -- {'male': 45, 'female': 55}
  language_distribution JSONB, -- {'en': 60, 'es': 30, 'pt': 10}
  interest_categories JSONB, -- ['technology', 'fashion', 'travel']
  -- Análisis temporal
  peak_activity_hours INTEGER[], -- [18, 19, 20, 21]
  peak_activity_days INTEGER[], -- [1, 2, 3, 4, 5] (weekdays)
  timezone TEXT,
  -- Datos económicos y de mercado
  avg_purchasing_power NUMERIC,
  market_potential_score NUMERIC,
  -- Metadatos
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_source TEXT, -- 'api', 'manual', 'inferred'
  confidence_score NUMERIC DEFAULT 0, -- 0-100
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para análisis de competidores y benchmarking
CREATE TABLE IF NOT EXISTS public.competitor_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin')),
  competitor_username TEXT NOT NULL,
  competitor_name TEXT,
  competitor_url TEXT,
  -- Métricas básicas
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  -- Análisis de contenido
  posting_frequency NUMERIC, -- posts per day
  avg_engagement_rate NUMERIC DEFAULT 0,
  best_performing_content_types TEXT[],
  top_hashtags TEXT[],
  content_themes TEXT[],
  -- Análisis temporal
  optimal_posting_times INTEGER[], -- hours
  optimal_posting_days INTEGER[], -- days of week
  -- Comparación con usuario
  follower_overlap_percentage NUMERIC DEFAULT 0,
  engagement_comparison NUMERIC DEFAULT 0, -- ratio: user_engagement / competitor_engagement
  content_similarity_score NUMERIC DEFAULT 0,
  -- Oportunidades identificadas
  content_gaps TEXT[],
  hashtag_opportunities TEXT[],
  collaboration_potential NUMERIC DEFAULT 0,
  -- Datos históricos
  growth_rate_monthly NUMERIC DEFAULT 0,
  engagement_trend TEXT, -- 'increasing', 'decreasing', 'stable'
  last_analyzed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para insights avanzados de audiencia
CREATE TABLE IF NOT EXISTS public.audience_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin')),
  insight_type TEXT NOT NULL, -- 'demographic', 'behavioral', 'interest', 'temporal'
  -- Segmentación de audiencia
  audience_segment TEXT, -- 'primary', 'secondary', 'lookalike'
  segment_size INTEGER DEFAULT 0,
  segment_percentage NUMERIC DEFAULT 0,
  -- Características demográficas
  age_ranges JSONB, -- {'18-24': 25, '25-34': 40, '35-44': 20, '45+': 15}
  gender_split JSONB, -- {'male': 45, 'female': 53, 'other': 2}
  education_levels JSONB,
  income_ranges JSONB,
  relationship_status JSONB,
  -- Intereses y comportamientos
  interests JSONB, -- categorías de interés con scores
  brand_affinities TEXT[],
  shopping_behaviors JSONB,
  content_preferences JSONB,
  device_usage JSONB, -- mobile vs desktop
  -- Patrones de actividad
  online_activity_patterns JSONB,
  engagement_patterns JSONB,
  content_consumption_habits JSONB,
  -- Valor de negocio
  conversion_potential NUMERIC DEFAULT 0,
  lifetime_value_estimate NUMERIC DEFAULT 0,
  purchase_intent_score NUMERIC DEFAULT 0,
  -- Metadatos
  analysis_period_start TIMESTAMP WITH TIME ZONE,
  analysis_period_end TIMESTAMP WITH TIME ZONE,
  confidence_level NUMERIC DEFAULT 0,
  sample_size INTEGER DEFAULT 0,
  raw_insights JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_followers_detailed_user_platform ON instagram_followers_detailed(user_id, instagram_user_id);
CREATE INDEX IF NOT EXISTS idx_social_calendar_user_platform_date ON social_media_calendar(user_id, platform, published_at);
CREATE INDEX IF NOT EXISTS idx_followers_location_user_platform ON followers_location_analysis(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_user_platform ON competitor_analysis(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_audience_insights_user_platform_type ON audience_insights(user_id, platform, insight_type);

-- Índices geoespaciales para análisis de ubicación
CREATE INDEX IF NOT EXISTS idx_followers_location_coordinates ON followers_location_analysis USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_followers_location_country ON followers_location_analysis(country, platform);

-- RLS Policies
ALTER TABLE public.instagram_followers_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers_location_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_insights ENABLE ROW LEVEL SECURITY;

-- Políticas para instagram_followers_detailed
CREATE POLICY "Users can view their own detailed followers" ON public.instagram_followers_detailed
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own detailed followers" ON public.instagram_followers_detailed
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own detailed followers" ON public.instagram_followers_detailed
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own detailed followers" ON public.instagram_followers_detailed
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para social_media_calendar
CREATE POLICY "Users can view their own calendar" ON public.social_media_calendar
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calendar entries" ON public.social_media_calendar
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calendar entries" ON public.social_media_calendar
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calendar entries" ON public.social_media_calendar
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para followers_location_analysis
CREATE POLICY "Users can view their own location analysis" ON public.followers_location_analysis
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own location analysis" ON public.followers_location_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own location analysis" ON public.followers_location_analysis
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own location analysis" ON public.followers_location_analysis
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para competitor_analysis
CREATE POLICY "Users can view their own competitor analysis" ON public.competitor_analysis
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own competitor analysis" ON public.competitor_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own competitor analysis" ON public.competitor_analysis
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own competitor analysis" ON public.competitor_analysis
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para audience_insights
CREATE POLICY "Users can view their own audience insights" ON public.audience_insights
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own audience insights" ON public.audience_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own audience insights" ON public.audience_insights
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own audience insights" ON public.audience_insights
  FOR DELETE USING (auth.uid() = user_id);

-- Funciones para automatizar cálculos
CREATE OR REPLACE FUNCTION public.calculate_posting_optimal_times(user_id_param UUID, platform_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Calcular mejores horarios basado en engagement histórico
  SELECT jsonb_build_object(
    'best_hours', array_agg(DISTINCT hour_of_day ORDER BY hour_of_day),
    'best_days', array_agg(DISTINCT day_of_week ORDER BY day_of_week),
    'avg_engagement', avg(engagement_rate)
  ) INTO result
  FROM public.social_media_calendar
  WHERE user_id = user_id_param 
    AND platform = platform_param
    AND engagement_rate > 0
    AND published_at >= NOW() - INTERVAL '30 days'
  GROUP BY hour_of_day, day_of_week
  HAVING avg(engagement_rate) > (
    SELECT avg(engagement_rate) * 1.1 
    FROM public.social_media_calendar 
    WHERE user_id = user_id_param AND platform = platform_param
  );
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_instagram_followers_detailed
  BEFORE UPDATE ON public.instagram_followers_detailed
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER trigger_update_social_media_calendar
  BEFORE UPDATE ON public.social_media_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER trigger_update_followers_location_analysis
  BEFORE UPDATE ON public.followers_location_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER trigger_update_competitor_analysis
  BEFORE UPDATE ON public.competitor_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER trigger_update_audience_insights
  BEFORE UPDATE ON public.audience_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();