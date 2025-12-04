-- =====================================================
-- Phase 4: Remove all legacy agent tables
-- These tables have been replaced by the unified platform_agents architecture
-- =====================================================

-- Drop tables with no foreign key dependencies first
DROP TABLE IF EXISTS agent_ratings CASCADE;
DROP TABLE IF EXISTS agent_knowledge_files CASCADE;
DROP TABLE IF EXISTS agent_analytics CASCADE;
DROP TABLE IF EXISTS agent_channels CASCADE;
DROP TABLE IF EXISTS agent_missions CASCADE;
DROP TABLE IF EXISTS agent_conversations CASCADE;
DROP TABLE IF EXISTS agent_api_endpoints CASCADE;
DROP TABLE IF EXISTS agent_deployment_instances CASCADE;
DROP TABLE IF EXISTS agent_deployments CASCADE;
DROP TABLE IF EXISTS agent_instances CASCADE;
DROP TABLE IF EXISTS agent_template_versions CASCADE;
DROP TABLE IF EXISTS agent_templates CASCADE;
DROP TABLE IF EXISTS agent_categories CASCADE;
DROP TABLE IF EXISTS user_agents CASCADE;

-- Add comment to document the migration
COMMENT ON TABLE platform_agents IS 'Unified agent catalog - replaces legacy agent_templates, ai_agents tables';
COMMENT ON TABLE company_enabled_agents IS 'Company agent enablement - replaces legacy agent_instances';
COMMENT ON TABLE company_agent_configurations IS 'User configurations per agent - replaces legacy agent deployment configs';
COMMENT ON TABLE agent_usage_log IS 'Agent execution tracking - replaces legacy agent_missions, agent_analytics';