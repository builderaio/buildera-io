-- Add prerequisites column to platform_agents
ALTER TABLE platform_agents ADD COLUMN IF NOT EXISTS 
  prerequisites jsonb DEFAULT '[]';

-- Add comment explaining the structure
COMMENT ON COLUMN platform_agents.prerequisites IS 'Array of prerequisite objects: {type: string, required: boolean, fields?: string[], minCount?: number, message: string, actionUrl: string}';

-- Update existing agents with sensible default prerequisites
UPDATE platform_agents SET prerequisites = '[
  {"type": "strategy", "required": true, "fields": ["mision", "propuesta_valor"], "message": "Define tu estrategia de marketing primero", "actionUrl": "/company/adn"}
]'::jsonb WHERE internal_code IN ('MKTG_STRATEGIST', 'CAMPAIGN_GENERATOR', 'CAMPAIGN_OPTIMIZER');

UPDATE platform_agents SET prerequisites = '[
  {"type": "strategy", "required": false, "message": "Una estrategia definida mejora los resultados", "actionUrl": "/company/adn"},
  {"type": "audiences", "required": false, "minCount": 1, "message": "Define audiencias para insights más precisos", "actionUrl": "/company/audiencias"}
]'::jsonb WHERE internal_code = 'INSIGHTS_GENERATOR';

UPDATE platform_agents SET prerequisites = '[
  {"type": "strategy", "required": true, "fields": ["mision"], "message": "Define tu estrategia primero", "actionUrl": "/company/adn"},
  {"type": "branding", "required": false, "fields": ["primary_color"], "message": "Configura tu identidad visual para mejor contenido", "actionUrl": "/company/adn"}
]'::jsonb WHERE internal_code IN ('CONTENT_CREATOR', 'CONTENT_GENERATOR');

UPDATE platform_agents SET prerequisites = '[
  {"type": "strategy", "required": true, "message": "Necesitas una estrategia para planificar contenido", "actionUrl": "/company/adn"}
]'::jsonb WHERE internal_code = 'CALENDAR_PLANNER';

UPDATE platform_agents SET prerequisites = '[
  {"type": "branding", "required": true, "fields": ["primary_color", "visual_identity"], "message": "Configura tu identidad visual primero", "actionUrl": "/company/adn"}
]'::jsonb WHERE internal_code IN ('IMAGE_CREATOR', 'VIDEO_CREATOR', 'REEL_CREATOR');

UPDATE platform_agents SET prerequisites = '[
  {"type": "social_connected", "required": false, "platforms": ["linkedin"], "message": "Conecta LinkedIn para análisis de tu perfil real", "actionUrl": "/company/redes"}
]'::jsonb WHERE internal_code = 'LINKEDIN_ANALYST';

UPDATE platform_agents SET prerequisites = '[
  {"type": "social_connected", "required": false, "platforms": ["instagram"], "message": "Conecta Instagram para análisis de tu perfil real", "actionUrl": "/company/redes"}
]'::jsonb WHERE internal_code = 'INSTAGRAM_ANALYST';

UPDATE platform_agents SET prerequisites = '[
  {"type": "social_connected", "required": false, "platforms": ["facebook"], "message": "Conecta Facebook para análisis de tu página real", "actionUrl": "/company/redes"}
]'::jsonb WHERE internal_code = 'FACEBOOK_ANALYST';

UPDATE platform_agents SET prerequisites = '[
  {"type": "social_connected", "required": false, "platforms": ["tiktok"], "message": "Conecta TikTok para análisis de tu cuenta real", "actionUrl": "/company/redes"}
]'::jsonb WHERE internal_code = 'TIKTOK_ANALYST';

UPDATE platform_agents SET prerequisites = '[
  {"type": "audiences", "required": true, "minCount": 1, "message": "Define al menos una audiencia objetivo", "actionUrl": "/company/audiencias"}
]'::jsonb WHERE internal_code IN ('AUDIENCE_ANALYST', 'AUDIENCE_INTELLIGENCE');