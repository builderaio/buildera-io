-- Tabla para tipos de agentes y sus especialidades
CREATE TABLE IF NOT EXISTS public.agent_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Nombre del ícono de Lucide
  color TEXT DEFAULT '#6366f1', -- Color hex para la categoría
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para agentes IA disponibles en el marketplace
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  detailed_description TEXT,
  category_id UUID REFERENCES public.agent_categories(id),
  capabilities TEXT[] DEFAULT '{}', -- Array de capacidades
  use_cases TEXT[] DEFAULT '{}', -- Array de casos de uso
  pricing_model TEXT DEFAULT 'freemium', -- 'free', 'freemium', 'premium', 'usage-based'
  price_per_use NUMERIC DEFAULT 0,
  monthly_price NUMERIC DEFAULT 0,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  popularity_score INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  model_provider TEXT DEFAULT 'openai', -- 'openai', 'anthropic', 'custom'
  model_name TEXT DEFAULT 'gpt-4o-mini',
  system_prompt TEXT NOT NULL,
  sample_conversations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para agentes que los usuarios han agregado a su workspace
CREATE TABLE IF NOT EXISTS public.user_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  custom_name TEXT, -- Nombre personalizado que el usuario le da al agente
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  custom_settings JSONB DEFAULT '{}',
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

-- Tabla para conversaciones con agentes
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.ai_agents(id),
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  context_data JSONB DEFAULT '{}', -- Datos del negocio para contexto
  status TEXT DEFAULT 'active', -- 'active', 'archived', 'completed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para valoraciones de agentes por usuarios
CREATE TABLE IF NOT EXISTS public.agent_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_ai_agents_category ON ai_agents(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_active ON ai_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_user_agents_user ON user_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user ON agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent ON agent_conversations(agent_id);

-- RLS para agent_categories (público para lectura)
ALTER TABLE public.agent_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent categories are viewable by everyone" 
ON public.agent_categories FOR SELECT 
USING (true);

-- RLS para ai_agents (público para lectura de agentes activos)
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active agents are viewable by everyone" 
ON public.ai_agents FOR SELECT 
USING (is_active = true);

-- RLS para user_agents
ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agents" 
ON public.user_agents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agents" 
ON public.user_agents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" 
ON public.user_agents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" 
ON public.user_agents FOR DELETE 
USING (auth.uid() = user_id);

-- RLS para agent_conversations
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" 
ON public.agent_conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" 
ON public.agent_conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.agent_conversations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.agent_conversations FOR DELETE 
USING (auth.uid() = user_id);

-- RLS para agent_ratings
ALTER TABLE public.agent_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings" 
ON public.agent_ratings FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own ratings" 
ON public.agent_ratings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.agent_ratings FOR UPDATE 
USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_conversations_updated_at
  BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();