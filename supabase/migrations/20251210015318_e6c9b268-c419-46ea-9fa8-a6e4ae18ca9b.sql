-- Update INSIGHTS_GENERATOR prerequisites to require social data
UPDATE platform_agents 
SET prerequisites = '[
  {"type": "social_data", "required": true, "minPosts": 5, 
   "message": "Necesitas al menos 5 publicaciones de redes sociales para generar insights precisos",
   "actionUrl": "/company/dashboard?tab=configuracion",
   "alternativeAction": {"type": "scrape", "label": "Importar datos"}}
]'::jsonb
WHERE internal_code = 'INSIGHTS_GENERATOR';

-- Update AUDIENCE_ANALYST prerequisites
UPDATE platform_agents 
SET prerequisites = '[
  {"type": "social_data", "required": true, "minPosts": 10, 
   "message": "Necesitas al menos 10 publicaciones para analizar tu audiencia con precisión",
   "actionUrl": "/company/dashboard?tab=configuracion",
   "alternativeAction": {"type": "scrape", "label": "Importar datos"}}
]'::jsonb
WHERE internal_code = 'AUDIENCE_ANALYST';

-- Update SOCIAL_ANALYZER prerequisites
UPDATE platform_agents 
SET prerequisites = '[
  {"type": "social_data", "required": true, "minPosts": 5, 
   "message": "Necesitas publicaciones importadas para analizar tu presencia social",
   "actionUrl": "/company/dashboard?tab=configuracion",
   "alternativeAction": {"type": "scrape", "label": "Importar datos"}}
]'::jsonb
WHERE internal_code = 'SOCIAL_ANALYZER';

-- Update platform-specific analysts
UPDATE platform_agents 
SET prerequisites = '[
  {"type": "social_data", "required": true, "minPosts": 3, "platforms": ["linkedin"],
   "message": "Necesitas publicaciones de LinkedIn importadas para este análisis",
   "actionUrl": "/company/dashboard?tab=configuracion",
   "alternativeAction": {"type": "scrape", "label": "Importar LinkedIn"}}
]'::jsonb
WHERE internal_code = 'LINKEDIN_ANALYST';

UPDATE platform_agents 
SET prerequisites = '[
  {"type": "social_data", "required": true, "minPosts": 3, "platforms": ["instagram"],
   "message": "Necesitas publicaciones de Instagram importadas para este análisis",
   "actionUrl": "/company/dashboard?tab=configuracion",
   "alternativeAction": {"type": "scrape", "label": "Importar Instagram"}}
]'::jsonb
WHERE internal_code = 'INSTAGRAM_ANALYST';

UPDATE platform_agents 
SET prerequisites = '[
  {"type": "social_data", "required": true, "minPosts": 3, "platforms": ["facebook"],
   "message": "Necesitas publicaciones de Facebook importadas para este análisis",
   "actionUrl": "/company/dashboard?tab=configuracion",
   "alternativeAction": {"type": "scrape", "label": "Importar Facebook"}}
]'::jsonb
WHERE internal_code = 'FACEBOOK_ANALYST';

UPDATE platform_agents 
SET prerequisites = '[
  {"type": "social_data", "required": true, "minPosts": 3, "platforms": ["tiktok"],
   "message": "Necesitas publicaciones de TikTok importadas para este análisis",
   "actionUrl": "/company/dashboard?tab=configuracion",
   "alternativeAction": {"type": "scrape", "label": "Importar TikTok"}}
]'::jsonb
WHERE internal_code = 'TIKTOK_ANALYST';

-- Update SEMANTIC_ANALYZER prerequisites
UPDATE platform_agents 
SET prerequisites = '[
  {"type": "social_data", "required": true, "minPosts": 10, 
   "message": "Necesitas al menos 10 publicaciones para un análisis semántico significativo",
   "actionUrl": "/company/dashboard?tab=configuracion",
   "alternativeAction": {"type": "scrape", "label": "Importar datos"}}
]'::jsonb
WHERE internal_code = 'SEMANTIC_ANALYZER';

-- Update COMPETITIVE_INTEL prerequisites (needs strategy + social data)
UPDATE platform_agents 
SET prerequisites = '[
  {"type": "strategy", "required": true,
   "message": "Define tu estrategia empresarial para un análisis competitivo efectivo",
   "actionUrl": "/company/dashboard?tab=adn"},
  {"type": "social_data", "required": false, "minPosts": 5, 
   "message": "Importar tus publicaciones mejorará el análisis comparativo",
   "actionUrl": "/company/dashboard?tab=configuracion",
   "alternativeAction": {"type": "scrape", "label": "Importar datos"}}
]'::jsonb
WHERE internal_code = 'COMPETITIVE_INTEL';