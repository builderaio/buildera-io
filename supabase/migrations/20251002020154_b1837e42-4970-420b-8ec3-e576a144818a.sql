-- Tabla para canales de comunicación por agente
CREATE TABLE public.agent_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_instance_id UUID NOT NULL REFERENCES public.agent_instances(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('web_chat', 'api', 'email', 'whatsapp', 'slack', 'dashboard')),
  channel_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  endpoint_url TEXT,
  access_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para deployments de agentes
CREATE TABLE public.agent_deployment_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_instance_id UUID NOT NULL REFERENCES public.agent_instances(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  deployment_name TEXT NOT NULL,
  deployment_config JSONB DEFAULT '{}',
  branding_config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing', 'archived')),
  widget_embed_code TEXT,
  api_documentation TEXT,
  chat_url TEXT,
  api_url TEXT,
  widget_url TEXT,
  email_address TEXT,
  dashboard_url TEXT,
  access_credentials JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para analytics de agentes
CREATE TABLE public.agent_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_instance_id UUID NOT NULL REFERENCES public.agent_instances(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para configuraciones de integraciones
CREATE TABLE public.integration_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_instance_id UUID NOT NULL REFERENCES public.agent_instances(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('zapier', 'make', 'salesforce', 'hubspot', 'shopify', 'zendesk', 'slack', 'whatsapp')),
  config_data JSONB NOT NULL DEFAULT '{}',
  credentials JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_agent_channels_instance ON public.agent_channels(agent_instance_id);
CREATE INDEX idx_agent_channels_type ON public.agent_channels(channel_type);
CREATE INDEX idx_deployment_instances_agent ON public.agent_deployment_instances(agent_instance_id);
CREATE INDEX idx_deployment_instances_company ON public.agent_deployment_instances(company_id);
CREATE INDEX idx_agent_analytics_instance ON public.agent_analytics(agent_instance_id);
CREATE INDEX idx_agent_analytics_recorded ON public.agent_analytics(recorded_at DESC);
CREATE INDEX idx_integration_configs_instance ON public.integration_configurations(agent_instance_id);

-- RLS Policies para agent_channels
ALTER TABLE public.agent_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage channels of their agents"
ON public.agent_channels
FOR ALL
USING (
  agent_instance_id IN (
    SELECT id FROM public.agent_instances WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  agent_instance_id IN (
    SELECT id FROM public.agent_instances WHERE user_id = auth.uid()
  )
);

-- RLS Policies para agent_deployment_instances
ALTER TABLE public.agent_deployment_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage deployments of their agents"
ON public.agent_deployment_instances
FOR ALL
USING (
  agent_instance_id IN (
    SELECT id FROM public.agent_instances WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  agent_instance_id IN (
    SELECT id FROM public.agent_instances WHERE user_id = auth.uid()
  )
);

-- RLS Policies para agent_analytics
ALTER TABLE public.agent_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics of their agents"
ON public.agent_analytics
FOR SELECT
USING (
  agent_instance_id IN (
    SELECT id FROM public.agent_instances WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert analytics"
ON public.agent_analytics
FOR INSERT
WITH CHECK (true);

-- RLS Policies para integration_configurations
ALTER TABLE public.integration_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage integrations of their agents"
ON public.integration_configurations
FOR ALL
USING (
  agent_instance_id IN (
    SELECT id FROM public.agent_instances WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  agent_instance_id IN (
    SELECT id FROM public.agent_instances WHERE user_id = auth.uid()
  )
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_agent_deployment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_channels_updated_at
BEFORE UPDATE ON public.agent_channels
FOR EACH ROW
EXECUTE FUNCTION update_agent_deployment_updated_at();

CREATE TRIGGER update_deployment_instances_updated_at
BEFORE UPDATE ON public.agent_deployment_instances
FOR EACH ROW
EXECUTE FUNCTION update_agent_deployment_updated_at();

CREATE TRIGGER update_integration_configs_updated_at
BEFORE UPDATE ON public.integration_configurations
FOR EACH ROW
EXECUTE FUNCTION update_agent_deployment_updated_at();