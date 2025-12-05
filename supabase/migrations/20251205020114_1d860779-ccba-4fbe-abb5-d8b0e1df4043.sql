-- Registrar 15 nuevos agentes en platform_agents
INSERT INTO platform_agents (internal_code, name, description, category, icon, execution_type, edge_function_name, credits_per_use, is_premium, min_plan_required, is_active, sort_order, is_onboarding_agent) VALUES
-- Agentes de Análisis por Plataforma
('LINKEDIN_ANALYST', 'Analista de LinkedIn', 'Analiza tus posts de LinkedIn y genera insights de engagement profesional', 'analytics', 'Linkedin', 'edge_function', 'linkedin-intelligent-analysis', 2, false, 'starter', true, 15, false),
('INSTAGRAM_ANALYST', 'Analista de Instagram', 'Analiza tu contenido de Instagram y optimiza tu estrategia visual', 'analytics', 'Instagram', 'edge_function', 'instagram-intelligent-analysis', 2, false, 'starter', true, 16, false),
('FACEBOOK_ANALYST', 'Analista de Facebook', 'Analiza tu presencia en Facebook y mejora tu alcance', 'analytics', 'Facebook', 'edge_function', 'facebook-intelligent-analysis', 2, false, 'starter', true, 17, false),
('TIKTOK_ANALYST', 'Analista de TikTok', 'Analiza tus videos de TikTok y optimiza viralidad', 'analytics', 'Video', 'edge_function', 'tiktok-intelligent-analysis', 2, false, 'growth', true, 18, false),

-- Agentes de Estrategia
('BUSINESS_STRATEGIST', 'Estratega de Negocio', 'Genera misión, visión y propuesta de valor para tu empresa', 'strategy', 'Briefcase', 'edge_function', 'company-strategy', 2, false, 'starter', true, 20, false),
('CAMPAIGN_GENERATOR', 'Generador de Campañas', 'Crea campañas de marketing completas con IA', 'marketing', 'Megaphone', 'edge_function', 'campaign-ai-generator', 3, true, 'growth', true, 21, false),

-- Agentes de Contenido
('REEL_CREATOR', 'Creador de Reels', 'Genera scripts y storyboards para reels virales', 'content', 'Film', 'edge_function', 'marketing-hub-reel-creator', 2, true, 'growth', true, 22, false),
('TEXT_OPTIMIZER', 'Optimizador de Texto', 'Mejora cualquier texto con IA manteniendo tu voz de marca', 'assistant', 'Sparkles', 'edge_function', 'era-content-optimizer', 1, false, 'starter', true, 23, false),
('CONTENT_GENERATOR', 'Generador de Contenido', 'Genera contenido libre basado en prompts personalizados', 'content', 'PenLine', 'edge_function', 'generate-company-content', 2, false, 'starter', true, 24, false),

-- Agentes Analytics Premium
('AUDIENCE_INTELLIGENCE', 'Inteligencia de Audiencia', 'Análisis profundo de tu audiencia con segmentación avanzada', 'analytics', 'Users', 'edge_function', 'audience-intelligence-analysis', 3, true, 'scale', true, 25, false),
('SEMANTIC_ANALYZER', 'Analizador Semántico', 'Análisis semántico avanzado de tu contenido', 'analytics', 'Search', 'edge_function', 'semantic-content-analyzer', 3, true, 'scale', true, 26, false),
('PREMIUM_INSIGHTS', 'Insights Premium', 'Insights avanzados con análisis predictivo', 'analytics', 'Diamond', 'edge_function', 'premium-ai-insights', 5, true, 'scale', true, 27, false),

-- Agentes Asistentes
('LEARNING_TUTOR', 'Tutor de Academia', 'Tu tutor personalizado de la Academia Buildera', 'learning', 'GraduationCap', 'edge_function', 'ai-learning-tutor', 1, false, 'starter', true, 28, false),
('NBA_ENGINE', 'Motor de Recomendaciones', 'Genera acciones recomendadas basadas en tu contexto', 'assistant', 'Target', 'edge_function', 'generate-next-best-actions', 1, false, 'starter', true, 29, false),
('SOCIAL_ANALYZER', 'Analizador Social', 'Análisis unificado de todas tus redes sociales', 'analytics', 'Globe', 'edge_function', 'social-media-analyzer', 2, false, 'starter', true, 30, false)
ON CONFLICT (internal_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  edge_function_name = EXCLUDED.edge_function_name,
  credits_per_use = EXCLUDED.credits_per_use,
  is_premium = EXCLUDED.is_premium,
  min_plan_required = EXCLUDED.min_plan_required,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;