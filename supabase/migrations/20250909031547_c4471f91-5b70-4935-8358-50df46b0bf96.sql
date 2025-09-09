-- Crear tabla para seguimiento del tour guiado
CREATE TABLE public.user_guided_tour (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT '{}',
  tour_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tour_completed_at TIMESTAMP WITH TIME ZONE,
  tour_completed BOOLEAN DEFAULT false,
  tour_skipped BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Crear tabla para audiencias personalizadas 
CREATE TABLE public.custom_audiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para análisis de audiencias
CREATE TABLE public.audience_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  insights JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para agentes contratados por usuarios
CREATE TABLE public.user_hired_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  hired_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  configuration JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.user_guided_tour ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hired_agents ENABLE ROW LEVEL SECURITY;

-- Create policies for user_guided_tour
CREATE POLICY "Users can view their own tour progress" 
ON public.user_guided_tour 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tour progress" 
ON public.user_guided_tour 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own tour progress" 
ON public.user_guided_tour 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for custom_audiences
CREATE POLICY "Users can view their own audiences" 
ON public.custom_audiences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audiences" 
ON public.custom_audiences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audiences" 
ON public.custom_audiences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audiences" 
ON public.custom_audiences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for audience_analysis
CREATE POLICY "Users can view their own audience analysis" 
ON public.audience_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create audience analysis" 
ON public.audience_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for user_hired_agents
CREATE POLICY "Users can view their own hired agents" 
ON public.user_hired_agents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can hire agents" 
ON public.user_hired_agents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their hired agents" 
ON public.user_hired_agents 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_guided_tour_updated_at
BEFORE UPDATE ON public.user_guided_tour
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_audiences_updated_at
BEFORE UPDATE ON public.custom_audiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();