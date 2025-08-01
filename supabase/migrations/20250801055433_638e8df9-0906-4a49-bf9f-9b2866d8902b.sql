-- Sistema de Gamificación para Academia Buildera

-- Tabla para cursos/módulos de aprendizaje
CREATE TABLE public.learning_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty_level TEXT NOT NULL DEFAULT 'beginner', -- beginner, intermediate, advanced
  estimated_duration_minutes INTEGER DEFAULT 30,
  learning_objectives TEXT[],
  prerequisites TEXT[],
  ai_tutor_personality JSONB DEFAULT '{"style": "friendly", "expertise": "general"}',
  content_outline JSONB,
  badge_design JSONB,
  points_reward INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para badges/certificaciones
CREATE TABLE public.learning_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1, -- 1=bronze, 2=silver, 3=gold, 4=platinum
  requirements JSONB, -- criterios para obtener el badge
  badge_image_url TEXT,
  linkedin_badge_data JSONB, -- datos específicos para LinkedIn
  points_required INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para progreso del usuario
CREATE TABLE public.user_learning_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed, certified
  progress_percentage NUMERIC DEFAULT 0,
  current_lesson INTEGER DEFAULT 1,
  total_lessons INTEGER DEFAULT 1,
  time_spent_minutes INTEGER DEFAULT 0,
  ai_interactions_count INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  best_quiz_score NUMERIC DEFAULT 0,
  learning_notes TEXT,
  ai_feedback JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Tabla para badges obtenidos por usuarios
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID REFERENCES public.learning_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verification_code TEXT UNIQUE,
  linkedin_shared BOOLEAN DEFAULT false,
  linkedin_shared_at TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Tabla para interacciones con AI tutor
CREATE TABLE public.ai_tutor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'learning', -- learning, quiz, clarification, practice
  messages JSONB DEFAULT '[]', -- conversación completa
  ai_personality JSONB,
  session_duration_minutes INTEGER DEFAULT 0,
  learning_effectiveness_score NUMERIC DEFAULT 0, -- 0-10 basado en AI assessment
  topics_covered TEXT[],
  knowledge_gaps_identified TEXT[],
  recommendations TEXT[],
  satisfaction_rating INTEGER, -- 1-5 rating del usuario
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para gamificación general del usuario
CREATE TABLE public.user_gamification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  modules_completed INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  ai_interactions_count INTEGER DEFAULT 0,
  total_study_time_minutes INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]',
  rank_position INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para evaluaciones inteligentes
CREATE TABLE public.ai_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL DEFAULT 'adaptive', -- adaptive, final, practice
  questions JSONB, -- preguntas generadas por AI
  user_answers JSONB,
  ai_evaluation JSONB, -- análisis detallado del rendimiento
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  time_taken_minutes INTEGER,
  difficulty_adapted BOOLEAN DEFAULT false,
  knowledge_areas_assessed TEXT[],
  strengths_identified TEXT[],
  improvement_areas TEXT[],
  next_recommendations TEXT[],
  passed BOOLEAN DEFAULT false,
  certification_eligible BOOLEAN DEFAULT false,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- learning_modules: visible para todos los usuarios autenticados
CREATE POLICY "Modules are viewable by authenticated users" 
ON public.learning_modules FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- learning_badges: visible para todos los usuarios autenticados
CREATE POLICY "Badges are viewable by authenticated users" 
ON public.learning_badges FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- user_learning_progress: usuarios pueden ver y gestionar su propio progreso
CREATE POLICY "Users can view their own progress" 
ON public.user_learning_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_learning_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_learning_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- user_badges: usuarios pueden ver sus badges
CREATE POLICY "Users can view their own badges" 
ON public.user_badges FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn badges" 
ON public.user_badges FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their badge sharing status" 
ON public.user_badges FOR UPDATE 
USING (auth.uid() = user_id);

-- ai_tutor_sessions: usuarios pueden gestionar sus sesiones
CREATE POLICY "Users can manage their AI tutor sessions" 
ON public.ai_tutor_sessions FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- user_gamification: usuarios pueden ver y actualizar su gamificación
CREATE POLICY "Users can view their own gamification data" 
ON public.user_gamification FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification data" 
ON public.user_gamification FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification data" 
ON public.user_gamification FOR UPDATE 
USING (auth.uid() = user_id);

-- ai_assessments: usuarios pueden gestionar sus evaluaciones
CREATE POLICY "Users can manage their AI assessments" 
ON public.ai_assessments FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_learning_modules_updated_at
BEFORE UPDATE ON public.learning_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_learning_progress_updated_at
BEFORE UPDATE ON public.user_learning_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at
BEFORE UPDATE ON public.user_gamification
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para optimización
CREATE INDEX idx_user_learning_progress_user_id ON public.user_learning_progress(user_id);
CREATE INDEX idx_user_learning_progress_module_id ON public.user_learning_progress(module_id);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_ai_tutor_sessions_user_id ON public.ai_tutor_sessions(user_id);
CREATE INDEX idx_ai_assessments_user_id ON public.ai_assessments(user_id);
CREATE INDEX idx_user_gamification_user_id ON public.user_gamification(user_id);

-- Funciones auxiliares

-- Función para calcular nivel basado en puntos
CREATE OR REPLACE FUNCTION public.calculate_user_level(total_points INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Cada nivel requiere más puntos exponencialmente
  IF total_points < 100 THEN RETURN 1;
  ELSIF total_points < 300 THEN RETURN 2;
  ELSIF total_points < 600 THEN RETURN 3;
  ELSIF total_points < 1000 THEN RETURN 4;
  ELSIF total_points < 1500 THEN RETURN 5;
  ELSIF total_points < 2100 THEN RETURN 6;
  ELSIF total_points < 2800 THEN RETURN 7;
  ELSIF total_points < 3600 THEN RETURN 8;
  ELSIF total_points < 4500 THEN RETURN 9;
  ELSE RETURN 10;
  END IF;
END;
$$;

-- Función para actualizar gamificación del usuario
CREATE OR REPLACE FUNCTION public.update_user_gamification(p_user_id UUID, p_points_earned INTEGER DEFAULT 0)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  current_points INTEGER;
  new_level INTEGER;
BEGIN
  -- Insert o update gamification data
  INSERT INTO public.user_gamification (user_id, total_points, experience_points, last_activity)
  VALUES (p_user_id, p_points_earned, p_points_earned, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = user_gamification.total_points + p_points_earned,
    experience_points = user_gamification.experience_points + p_points_earned,
    last_activity = now(),
    updated_at = now();
  
  -- Calcular nuevo nivel
  SELECT total_points INTO current_points 
  FROM public.user_gamification 
  WHERE user_id = p_user_id;
  
  new_level := public.calculate_user_level(current_points);
  
  -- Actualizar nivel
  UPDATE public.user_gamification 
  SET level = new_level 
  WHERE user_id = p_user_id;
END;
$$;

-- Insertar algunos módulos de ejemplo
INSERT INTO public.learning_modules (title, description, category, difficulty_level, learning_objectives, points_reward) VALUES
('Fundamentos de IA para Negocios', 'Aprende los conceptos básicos de inteligencia artificial aplicados al mundo empresarial', 'ai_fundamentals', 'beginner', ARRAY['Comprender qué es la IA', 'Identificar oportunidades de negocio', 'Conocer herramientas básicas'], 150),
('Marketing Digital con IA', 'Domina las herramientas de IA para potenciar tu estrategia de marketing', 'marketing', 'intermediate', ARRAY['Automatización de marketing', 'Análisis predictivo', 'Personalización con IA'], 200),
('Análisis de Datos con IA', 'Aprende a extraer insights valiosos de tus datos usando IA', 'analytics', 'intermediate', ARRAY['Análisis predictivo', 'Visualización inteligente', 'Toma de decisiones basada en datos'], 250),
('Liderazgo en la Era Digital', 'Desarrolla habilidades de liderazgo para equipos que trabajen con IA', 'leadership', 'advanced', ARRAY['Gestión de equipos IA', 'Transformación digital', 'Ética en IA'], 300);

-- Insertar badges de ejemplo
INSERT INTO public.learning_badges (name, description, category, level, points_required) VALUES
('Explorador de IA', 'Completó su primer módulo de IA', 'ai_fundamentals', 1, 100),
('Analista Digital', 'Dominó herramientas básicas de análisis', 'analytics', 2, 300),
('Estratega de Marketing', 'Expert en marketing digital con IA', 'marketing', 3, 600),
('Líder Digital', 'Certificado en liderazgo digital avanzado', 'leadership', 4, 1000);