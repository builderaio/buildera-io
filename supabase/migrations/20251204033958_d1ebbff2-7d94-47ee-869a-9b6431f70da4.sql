-- Extender platform_agents para soportar OpenAI Agents SDK
ALTER TABLE public.platform_agents 
ADD COLUMN IF NOT EXISTS agent_type TEXT DEFAULT 'static' CHECK (agent_type IN ('static', 'dynamic', 'hybrid')),
ADD COLUMN IF NOT EXISTS sdk_version TEXT DEFAULT 'response-api',
ADD COLUMN IF NOT EXISTS openai_agent_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sfia_skills JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS average_sfia_level NUMERIC,
ADD COLUMN IF NOT EXISTS primary_function TEXT,
ADD COLUMN IF NOT EXISTS supports_handoffs BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS guardrails_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tracing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tools_config JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS model_name TEXT DEFAULT 'gpt-5-mini-2025-08-07',
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Agregar comentarios
COMMENT ON COLUMN public.platform_agents.agent_type IS 'Tipo: static (edge function), dynamic (OpenAI SDK), hybrid (ambos)';
COMMENT ON COLUMN public.platform_agents.sdk_version IS 'Versión del SDK: response-api, assistants-v2, agents-sdk';
COMMENT ON COLUMN public.platform_agents.openai_agent_config IS 'Configuración completa para OpenAI Agents SDK';
COMMENT ON COLUMN public.platform_agents.sfia_skills IS 'Habilidades SFIA mapeadas del agente';
COMMENT ON COLUMN public.platform_agents.supports_handoffs IS 'Si el agente puede delegar a otros agentes';
COMMENT ON COLUMN public.platform_agents.guardrails_config IS 'Configuración de guardrails y validaciones';
COMMENT ON COLUMN public.platform_agents.voice_enabled IS 'Si soporta Realtime Voice API';