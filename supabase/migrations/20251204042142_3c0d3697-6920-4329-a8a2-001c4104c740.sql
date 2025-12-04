-- Fase 1: Consolidar ai_workforce_agents en platform_agents

-- 1. Añadir campo is_featured a platform_agents si no existe
ALTER TABLE public.platform_agents 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- 2. Migrar todos los agentes de ai_workforce_agents a platform_agents
INSERT INTO public.platform_agents (
  internal_code,
  name,
  description,
  category,
  icon,
  execution_type,
  edge_function_name,
  credits_per_use,
  is_premium,
  min_plan_required,
  is_active,
  sort_order,
  input_schema,
  output_schema,
  is_featured,
  instructions,
  tools_config
)
SELECT 
  internal_id as internal_code,
  role_name as name,
  description,
  'workforce' as category,
  COALESCE(avatar_icon, 'brain') as icon,
  COALESCE(execution_type, 'edge_function') as execution_type,
  execution_resource_id as edge_function_name,
  1 as credits_per_use,
  false as is_premium,
  'starter' as min_plan_required,
  is_active,
  COALESCE((SELECT MAX(sort_order) FROM platform_agents), 0) + ROW_NUMBER() OVER (ORDER BY created_at) as sort_order,
  input_parameters as input_schema,
  NULL as output_schema,
  COALESCE(is_featured, false) as is_featured,
  primary_function as instructions,
  jsonb_build_object(
    'sfia_skills', sfia_skills,
    'key_skills_summary', key_skills_summary,
    'average_sfia_level', average_sfia_level
  ) as tools_config
FROM public.ai_workforce_agents
WHERE NOT EXISTS (
  SELECT 1 FROM public.platform_agents pa 
  WHERE pa.internal_code = ai_workforce_agents.internal_id
);

-- 3. Crear tabla de mapeo temporal para actualizar referencias
CREATE TEMP TABLE agent_id_mapping AS
SELECT 
  awa.id as old_id,
  pa.id as new_id
FROM public.ai_workforce_agents awa
JOIN public.platform_agents pa ON pa.internal_code = awa.internal_id;

-- 4. Actualizar ai_workforce_team_members para usar platform_agents
-- Primero verificamos si hay registros y actualizamos
UPDATE public.ai_workforce_team_members tm
SET agent_id = m.new_id
FROM agent_id_mapping m
WHERE tm.agent_id = m.old_id;

-- 5. Actualizar ai_workforce_team_tasks si tiene agent_id
UPDATE public.ai_workforce_team_tasks tt
SET agent_id = m.new_id
FROM agent_id_mapping m
WHERE tt.agent_id = m.old_id;

-- 6. Modificar la foreign key de ai_workforce_team_members para apuntar a platform_agents
ALTER TABLE public.ai_workforce_team_members 
DROP CONSTRAINT IF EXISTS ai_workforce_team_members_agent_id_fkey;

ALTER TABLE public.ai_workforce_team_members
ADD CONSTRAINT ai_workforce_team_members_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES public.platform_agents(id);

-- 7. Modificar la foreign key de ai_workforce_team_tasks
ALTER TABLE public.ai_workforce_team_tasks
DROP CONSTRAINT IF EXISTS ai_workforce_team_tasks_agent_id_fkey;

ALTER TABLE public.ai_workforce_team_tasks
ADD CONSTRAINT ai_workforce_team_tasks_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES public.platform_agents(id);

-- 8. Eliminar la tabla ai_workforce_agents (ya migrada)
DROP TABLE IF EXISTS public.ai_workforce_agents CASCADE;