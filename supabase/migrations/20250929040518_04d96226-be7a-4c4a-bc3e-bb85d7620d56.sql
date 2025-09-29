-- Primero eliminamos las políticas existentes que están causando problemas
DROP POLICY IF EXISTS "Allow developers to create templates" ON whitelabel_agent_templates;
DROP POLICY IF EXISTS "Allow developers to view their templates" ON whitelabel_agent_templates;
DROP POLICY IF EXISTS "Allow developers to update their templates" ON whitelabel_agent_templates;
DROP POLICY IF EXISTS "Allow developers to delete their templates" ON whitelabel_agent_templates;

-- Creamos políticas RLS que permitan a los desarrolladores gestionar sus plantillas
CREATE POLICY "Developers can create their own agent templates"
ON whitelabel_agent_templates
FOR INSERT 
WITH CHECK (developer_id = auth.uid());

CREATE POLICY "Developers can view their own agent templates"
ON whitelabel_agent_templates
FOR SELECT
USING (developer_id = auth.uid());

CREATE POLICY "Developers can update their own agent templates"
ON whitelabel_agent_templates
FOR UPDATE
USING (developer_id = auth.uid())
WITH CHECK (developer_id = auth.uid());

CREATE POLICY "Developers can delete their own agent templates"
ON whitelabel_agent_templates
FOR DELETE
USING (developer_id = auth.uid());

-- Política adicional para que las empresas puedan ver plantillas publicadas
CREATE POLICY "Companies can view published agent templates"
ON whitelabel_agent_templates
FOR SELECT
USING (is_published = true);

-- Crear tabla para instancias de agentes desplegados por empresas
CREATE TABLE IF NOT EXISTS agent_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES whitelabel_agent_templates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  deployment_name TEXT NOT NULL,
  custom_configuration JSONB DEFAULT '{}',
  api_endpoint_url TEXT,
  widget_embed_code TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  monthly_usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, company_id, deployment_name)
);

-- RLS para deployments
ALTER TABLE agent_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can manage their agent deployments"
ON agent_deployments
FOR ALL
USING (company_id IN (
  SELECT cm.company_id 
  FROM company_members cm 
  WHERE cm.user_id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT cm.company_id 
  FROM company_members cm 
  WHERE cm.user_id = auth.uid()
));

-- Crear tabla para tracking de revenue share
CREATE TABLE IF NOT EXISTS revenue_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES whitelabel_agent_templates(id) ON DELETE CASCADE,
  deployment_id UUID NOT NULL REFERENCES agent_deployments(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL,
  company_id UUID NOT NULL,
  usage_period_start TIMESTAMPTZ NOT NULL,
  usage_period_end TIMESTAMPTZ NOT NULL,
  total_usage_count INTEGER DEFAULT 0,
  revenue_amount DECIMAL(10,2) DEFAULT 0,
  developer_share DECIMAL(10,2) DEFAULT 0,
  platform_share DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'disputed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, deployment_id, usage_period_start)
);

-- RLS para revenue tracking
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can view their revenue"
ON revenue_tracking
FOR SELECT
USING (developer_id = auth.uid());

-- Crear tabla para APIs y endpoints de agentes
CREATE TABLE IF NOT EXISTS agent_api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID NOT NULL REFERENCES agent_deployments(id) ON DELETE CASCADE,
  endpoint_type TEXT NOT NULL CHECK (endpoint_type IN ('chat', 'webhook', 'widget', 'api')),
  endpoint_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  rate_limit INTEGER DEFAULT 1000,
  auth_required BOOLEAN DEFAULT true,
  cors_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para API endpoints
ALTER TABLE agent_api_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can manage their API endpoints"
ON agent_api_endpoints
FOR ALL
USING (deployment_id IN (
  SELECT ad.id 
  FROM agent_deployments ad 
  JOIN company_members cm ON ad.company_id = cm.company_id 
  WHERE cm.user_id = auth.uid()
))
WITH CHECK (deployment_id IN (
  SELECT ad.id 
  FROM agent_deployments ad 
  JOIN company_members cm ON ad.company_id = cm.company_id 
  WHERE cm.user_id = auth.uid()
));

-- Función para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para auto-actualizar updated_at
CREATE TRIGGER update_agent_deployments_updated_at 
    BEFORE UPDATE ON agent_deployments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_api_endpoints_updated_at 
    BEFORE UPDATE ON agent_api_endpoints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();