-- Add n8n_config column to platform_agents for n8n workflow agents
ALTER TABLE public.platform_agents 
ADD COLUMN IF NOT EXISTS n8n_config JSONB DEFAULT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN public.platform_agents.n8n_config IS 'Configuration for n8n workflow agents: { webhook_url, http_method, requires_auth, input_schema, output_mappings, timeout_ms }';