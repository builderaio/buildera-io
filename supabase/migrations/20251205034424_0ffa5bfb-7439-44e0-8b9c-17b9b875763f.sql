-- Add context_requirements and payload_template columns to platform_agents
ALTER TABLE platform_agents ADD COLUMN IF NOT EXISTS 
  context_requirements jsonb DEFAULT '{"needsStrategy": false, "needsAudiences": false, "needsBranding": false}';

ALTER TABLE platform_agents ADD COLUMN IF NOT EXISTS 
  payload_template jsonb DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN platform_agents.context_requirements IS 'Defines what company context data the agent needs (strategy, audiences, branding)';
COMMENT ON COLUMN platform_agents.payload_template IS 'JSON template for mapping company data to edge function payload. Uses {{variable.path}} syntax.';