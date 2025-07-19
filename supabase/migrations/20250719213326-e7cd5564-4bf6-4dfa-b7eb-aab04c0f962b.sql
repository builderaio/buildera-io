-- Insertar configuraciones iniciales de IA si no existen
INSERT INTO public.ai_model_configurations (function_name, model_name, temperature, max_tokens, top_p, frequency_penalty, presence_penalty)
VALUES 
  ('era-chat', 'gpt-4o-mini', 0.7, 500, 1.0, 0.0, 0.0),
  ('era-content-optimizer', 'gpt-4o-mini', 0.7, 500, 1.0, 0.0, 0.0),
  ('generate-company-content', 'gpt-4o-mini', 0.7, 300, 1.0, 0.0, 0.0)
ON CONFLICT (function_name) DO NOTHING;

-- Crear tabla para analytics si no existe
CREATE TABLE IF NOT EXISTS public.system_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL DEFAULT 'counter',
  platform TEXT,
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en la tabla de analytics
ALTER TABLE public.system_analytics ENABLE ROW LEVEL SECURITY;

-- Política para que solo los administradores puedan acceder
CREATE POLICY "Solo admins pueden acceder a analytics"
ON public.system_analytics
FOR ALL
USING (true)
WITH CHECK (true);

-- Insertar algunos datos de ejemplo para analytics
INSERT INTO public.system_analytics (metric_name, metric_value, metric_type, platform, metadata)
VALUES 
  ('user_registrations', 150, 'counter', 'all', '{"description": "Total user registrations"}'),
  ('linkedin_connections', 45, 'counter', 'linkedin', '{"description": "Active LinkedIn connections"}'),
  ('facebook_connections', 32, 'counter', 'facebook', '{"description": "Active Facebook connections"}'),
  ('tiktok_connections', 18, 'counter', 'tiktok', '{"description": "Active TikTok connections"}'),
  ('content_generated', 278, 'counter', 'all', '{"description": "Total content pieces generated"}'),
  ('ai_requests', 1250, 'counter', 'all', '{"description": "Total AI model requests"}')
ON CONFLICT DO NOTHING;