-- Crear tabla de expertos
CREATE TABLE public.experts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialization TEXT NOT NULL,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  languages TEXT[] DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  profile_image_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de disponibilidad de expertos
CREATE TABLE public.expert_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(expert_id, day_of_week, start_time, end_time)
);

-- Crear tabla de citas/sesiones
CREATE TABLE public.expert_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  session_type TEXT NOT NULL DEFAULT 'consultation', -- consultation, mentoring, review
  topic TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
  meeting_link TEXT,
  notes TEXT,
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_feedback TEXT,
  expert_notes TEXT,
  price_paid NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de especialidades de expertos
CREATE TABLE public.expert_specializations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- marketing, ai, automation, business, etc.
  subcategory TEXT NOT NULL,
  skill_level TEXT NOT NULL DEFAULT 'intermediate', -- beginner, intermediate, advanced, expert
  years_experience INTEGER DEFAULT 0,
  certifications TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(expert_id, category, subcategory)
);

-- Enable RLS
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_specializations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experts
CREATE POLICY "Experts are viewable by everyone" ON public.experts
  FOR SELECT USING (is_available = true);

CREATE POLICY "Users can update their own expert profile" ON public.experts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expert profile" ON public.experts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expert profile" ON public.experts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for expert_availability
CREATE POLICY "Expert availability is viewable by everyone" ON public.expert_availability
  FOR SELECT USING (true);

CREATE POLICY "Experts can manage their availability" ON public.expert_availability
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.experts WHERE id = expert_availability.expert_id
    )
  );

-- RLS Policies for expert_sessions
CREATE POLICY "Users can view their own sessions" ON public.expert_sessions
  FOR SELECT USING (
    auth.uid() = client_user_id OR 
    auth.uid() IN (
      SELECT user_id FROM public.experts WHERE id = expert_sessions.expert_id
    )
  );

CREATE POLICY "Users can create sessions for themselves" ON public.expert_sessions
  FOR INSERT WITH CHECK (auth.uid() = client_user_id);

CREATE POLICY "Users can update their own sessions" ON public.expert_sessions
  FOR UPDATE USING (
    auth.uid() = client_user_id OR 
    auth.uid() IN (
      SELECT user_id FROM public.experts WHERE id = expert_sessions.expert_id
    )
  );

-- RLS Policies for expert_specializations
CREATE POLICY "Specializations are viewable by everyone" ON public.expert_specializations
  FOR SELECT USING (true);

CREATE POLICY "Experts can manage their specializations" ON public.expert_specializations
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.experts WHERE id = expert_specializations.expert_id
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_experts_specialization ON public.experts(specialization);
CREATE INDEX idx_experts_rating ON public.experts(rating DESC);
CREATE INDEX idx_experts_available ON public.experts(is_available, is_verified);
CREATE INDEX idx_expert_availability_expert_day ON public.expert_availability(expert_id, day_of_week);
CREATE INDEX idx_expert_sessions_scheduled ON public.expert_sessions(scheduled_at);
CREATE INDEX idx_expert_sessions_status ON public.expert_sessions(status);
CREATE INDEX idx_expert_sessions_client ON public.expert_sessions(client_user_id);
CREATE INDEX idx_expert_specializations_category ON public.expert_specializations(category, subcategory);

-- Create update triggers
CREATE TRIGGER update_experts_updated_at
  BEFORE UPDATE ON public.experts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER update_expert_availability_updated_at
  BEFORE UPDATE ON public.expert_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER update_expert_sessions_updated_at
  BEFORE UPDATE ON public.expert_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();

-- Insert sample experts data
INSERT INTO public.experts (
  user_id, full_name, email, specialization, bio, experience_years, 
  hourly_rate, rating, total_sessions, languages, timezone, is_verified
) VALUES 
(
  gen_random_uuid(),
  'María González',
  'maria.gonzalez@buildera.com',
  'Marketing Digital & IA',
  'Especialista en implementación de IA para estrategias de marketing digital. He ayudado a más de 100 empresas a optimizar sus campañas usando machine learning y automatización inteligente.',
  8,
  150.00,
  4.9,
  247,
  ARRAY['Español', 'Inglés'],
  'Europe/Madrid',
  true
),
(
  gen_random_uuid(),
  'Carlos Rodriguez',
  'carlos.rodriguez@buildera.com',
  'Automatización de Procesos',
  'Consultor senior en automatización empresarial con experiencia en RPA, workflows inteligentes y optimización de procesos usando IA. Especializado en transformación digital.',
  12,
  180.00,
  4.8,
  312,
  ARRAY['Español', 'Inglés', 'Portugués'],
  'America/Mexico_City',
  true
),
(
  gen_random_uuid(),
  'Ana Martínez',
  'ana.martinez@buildera.com',
  'Estrategia Empresarial & IA',
  'Estratega de negocios especializada en implementación de IA para empresas. Ayudo a organizaciones a definir roadmaps de adopción tecnológica y maximizar ROI en proyectos de IA.',
  10,
  200.00,
  4.9,
  189,
  ARRAY['Español', 'Inglés'],
  'America/Bogota',
  true
);

-- Insert specializations for the sample experts
INSERT INTO public.expert_specializations (expert_id, category, subcategory, skill_level, years_experience, description) VALUES
-- María González specializations
((SELECT id FROM public.experts WHERE email = 'maria.gonzalez@buildera.com'), 'marketing', 'digital_campaigns', 'expert', 8, 'Optimización de campañas digitales con IA predictiva'),
((SELECT id FROM public.experts WHERE email = 'maria.gonzalez@buildera.com'), 'marketing', 'social_media', 'expert', 6, 'Estrategias de redes sociales automatizadas'),
((SELECT id FROM public.experts WHERE email = 'maria.gonzalez@buildera.com'), 'ai', 'machine_learning', 'advanced', 5, 'Implementación de ML en marketing'),

-- Carlos Rodriguez specializations  
((SELECT id FROM public.experts WHERE email = 'carlos.rodriguez@buildera.com'), 'automation', 'process_optimization', 'expert', 12, 'Automatización de procesos empresariales complejos'),
((SELECT id FROM public.experts WHERE email = 'carlos.rodriguez@buildera.com'), 'automation', 'rpa', 'expert', 10, 'Robotic Process Automation'),
((SELECT id FROM public.experts WHERE email = 'carlos.rodriguez@buildera.com'), 'ai', 'workflow_automation', 'expert', 8, 'Workflows inteligentes con IA'),

-- Ana Martínez specializations
((SELECT id FROM public.experts WHERE email = 'ana.martinez@buildera.com'), 'business', 'strategy', 'expert', 10, 'Estrategia empresarial y transformación digital'),
((SELECT id FROM public.experts WHERE email = 'ana.martinez@buildera.com'), 'business', 'ai_adoption', 'expert', 7, 'Adopción estratégica de IA en empresas'),
((SELECT id FROM public.experts WHERE email = 'ana.martinez@buildera.com'), 'ai', 'business_intelligence', 'expert', 9, 'BI y analytics con IA');

-- Insert availability for experts (Monday to Friday, different time zones)
INSERT INTO public.expert_availability (expert_id, day_of_week, start_time, end_time) VALUES
-- María González (Europe/Madrid) - Monday to Friday 9AM-6PM
((SELECT id FROM public.experts WHERE email = 'maria.gonzalez@buildera.com'), 1, '09:00', '18:00'),
((SELECT id FROM public.experts WHERE email = 'maria.gonzalez@buildera.com'), 2, '09:00', '18:00'),
((SELECT id FROM public.experts WHERE email = 'maria.gonzalez@buildera.com'), 3, '09:00', '18:00'),
((SELECT id FROM public.experts WHERE email = 'maria.gonzalez@buildera.com'), 4, '09:00', '18:00'),
((SELECT id FROM public.experts WHERE email = 'maria.gonzalez@buildera.com'), 5, '09:00', '18:00'),

-- Carlos Rodriguez (America/Mexico_City) - Monday to Friday 8AM-5PM  
((SELECT id FROM public.experts WHERE email = 'carlos.rodriguez@buildera.com'), 1, '08:00', '17:00'),
((SELECT id FROM public.experts WHERE email = 'carlos.rodriguez@buildera.com'), 2, '08:00', '17:00'),
((SELECT id FROM public.experts WHERE email = 'carlos.rodriguez@buildera.com'), 3, '08:00', '17:00'),
((SELECT id FROM public.experts WHERE email = 'carlos.rodriguez@buildera.com'), 4, '08:00', '17:00'),
((SELECT id FROM public.experts WHERE email = 'carlos.rodriguez@buildera.com'), 5, '08:00', '17:00'),

-- Ana Martínez (America/Bogota) - Monday to Friday 7AM-4PM
((SELECT id FROM public.experts WHERE email = 'ana.martinez@buildera.com'), 1, '07:00', '16:00'),
((SELECT id FROM public.experts WHERE email = 'ana.martinez@buildera.com'), 2, '07:00', '16:00'),
((SELECT id FROM public.experts WHERE email = 'ana.martinez@buildera.com'), 3, '07:00', '16:00'),
((SELECT id FROM public.experts WHERE email = 'ana.martinez@buildera.com'), 4, '07:00', '16:00'),
((SELECT id FROM public.experts WHERE email = 'ana.martinez@buildera.com'), 5, '07:00', '16:00');