-- Update MKTG_STRATEGIST to require audiences and add proper prerequisites
UPDATE platform_agents 
SET 
  context_requirements = jsonb_set(
    COALESCE(context_requirements, '{}'::jsonb), 
    '{needsAudiences}', 
    'true'
  ),
  prerequisites = '[
    {"type": "strategy", "required": true, "fields": ["mision", "propuesta_valor"], "message": "Define tu estrategia de marketing primero", "actionUrl": "/company/adn"},
    {"type": "audiences", "required": true, "minCount": 1, "message": "Necesitas al menos una audiencia definida", "actionUrl": "/company/adn#audiencias"}
  ]'::jsonb
WHERE internal_code = 'MKTG_STRATEGIST';