-- =====================================================
-- Cleanup: Remove unused agent tables
-- These tables have no code references and no data
-- =====================================================

-- Drop ai_agents table (replaced by platform_agents)
DROP TABLE IF EXISTS ai_agents CASCADE;

-- Drop user_hired_agents table (never used)
DROP TABLE IF EXISTS user_hired_agents CASCADE;

-- Drop agent_logs table (no code references, use agent_usage_log instead)
DROP TABLE IF EXISTS agent_logs CASCADE;