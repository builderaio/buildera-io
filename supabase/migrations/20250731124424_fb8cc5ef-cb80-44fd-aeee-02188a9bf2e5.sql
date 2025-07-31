-- Crear tabla para métricas generales del dashboard
CREATE TABLE IF NOT EXISTS public.company_dashboard_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Métricas de agentes
  total_agents INTEGER DEFAULT 0,
  active_agents INTEGER DEFAULT 0,
  agent_missions_completed INTEGER DEFAULT 0,
  agent_hours_saved NUMERIC DEFAULT 0,
  
  -- Métricas de marketing
  total_social_connections INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  reach_growth_percent NUMERIC DEFAULT 0,
  
  -- Métricas de archivos/conocimiento
  total_files INTEGER DEFAULT 0,
  knowledge_base_size_mb NUMERIC DEFAULT 0,
  
  -- Métricas financieras estimadas
  estimated_cost_savings NUMERIC DEFAULT 0,
  roi_percentage NUMERIC DEFAULT 0,
  
  -- Métricas de productividad
  tasks_automated INTEGER DEFAULT 0,
  efficiency_score NUMERIC DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.company_dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own dashboard metrics" 
ON public.company_dashboard_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard metrics" 
ON public.company_dashboard_metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard metrics" 
ON public.company_dashboard_metrics 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Crear tabla para alertas y notificaciones del dashboard
CREATE TABLE IF NOT EXISTS public.dashboard_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'opportunity', 'warning', 'achievement', 'recommendation'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  action_url TEXT,
  action_text TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.dashboard_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own dashboard alerts" 
ON public.dashboard_alerts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard alerts" 
ON public.dashboard_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard alerts" 
ON public.dashboard_alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard alerts" 
ON public.dashboard_alerts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_dashboard_metrics_updated_at 
BEFORE UPDATE ON public.company_dashboard_metrics 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_alerts_updated_at 
BEFORE UPDATE ON public.dashboard_alerts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();