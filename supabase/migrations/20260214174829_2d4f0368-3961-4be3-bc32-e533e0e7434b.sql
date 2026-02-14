
-- Update subscription plans to reflect autonomy-level pricing strategy
UPDATE subscription_plans SET 
  name = 'Assisted Mode',
  slug = 'assisted',
  description = 'AI-assisted marketing operations with human oversight',
  price_monthly = 0,
  price_yearly = 0,
  features = '["1 AI agent (Marketing Strategist)", "Marketing department only", "Manual execution with AI suggestions", "Basic analytics dashboard", "500 data analyses/month", "10 content generations/month", "Community support"]'::jsonb,
  limits = '{"agents_enabled": 1, "departments": 1, "autonomy_level": "assisted", "credits_monthly": 100, "data_analysis": 500, "content_generation": 10, "social_integrations": 0, "governance_controls": "basic"}'::jsonb
WHERE slug = 'starter';

UPDATE subscription_plans SET 
  name = 'Growth Mode',
  slug = 'growth',
  description = 'Semi-autonomous operations across 3 core departments',
  price_monthly = 89,
  price_yearly = 890,
  features = '["5 AI agents across departments", "Marketing + Sales + Customer Service", "Semi-autonomous execution cycle", "Budget guardrails & daily limits", "5,000 data analyses/month", "50 content generations/month", "2 social media integrations", "Weekly automated reports", "Post-execution human review"]'::jsonb,
  limits = '{"agents_enabled": 5, "departments": 3, "autonomy_level": "semi_autonomous", "credits_monthly": 500, "data_analysis": 5000, "content_generation": 50, "social_integrations": 2, "governance_controls": "standard"}'::jsonb
WHERE slug = 'growth';

UPDATE subscription_plans SET 
  name = 'Enterprise Autopilot',
  slug = 'autopilot',
  description = 'Full autonomous enterprise brain across all 6 departments',
  price_monthly = 249,
  price_yearly = 2490,
  features = '["15+ AI agents across all departments", "All 6 departments: Marketing, Sales, Finance, Legal, HR, Operations", "Full SENSE-THINK-GUARD-ACT-LEARN cycle", "Capability Genesis Engine", "Advanced guardrails & compliance layer", "Unlimited content generation", "All social media integrations", "Real-time risk monitoring dashboard", "Autopilot Memory & Learning", "Priority support"]'::jsonb,
  limits = '{"agents_enabled": 15, "departments": 6, "autonomy_level": "full_autopilot", "credits_monthly": 2000, "data_analysis": 20000, "content_generation": -1, "social_integrations": -1, "governance_controls": "advanced"}'::jsonb
WHERE slug = 'scale';

UPDATE subscription_plans SET 
  name = 'Custom Adaptive',
  slug = 'custom',
  description = 'Tailored autonomous infrastructure for enterprise-scale operations',
  price_monthly = 0,
  price_yearly = 0,
  features = '["Unlimited AI agents + custom agents", "All departments + custom verticals", "Fully adaptive autonomy with executive escalation", "Custom guardrails & compliance policies", "White-label available", "Dedicated account manager", "Custom API integrations", "SLA guaranteed", "On-premise deployment option", "Custom training & onboarding"]'::jsonb,
  limits = '{"agents_enabled": -1, "departments": -1, "autonomy_level": "adaptive", "credits_monthly": -1, "data_analysis": -1, "content_generation": -1, "social_integrations": -1, "governance_controls": "custom", "white_label": true, "custom_agents": true}'::jsonb
WHERE slug = 'enterprise';
