-- Crear función RPC segura para que admins obtengan empresas con sus miembros
CREATE OR REPLACE FUNCTION public.get_all_companies_admin()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  website_url text,
  industry_sector text,
  company_size text,
  country text,
  logo_url text,
  created_at timestamptz,
  is_active boolean,
  deactivated_at timestamptz,
  member_count bigint,
  owner_name text,
  owner_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Solo permitir a administradores
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden acceder a esta función';
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.website_url,
    c.industry_sector,
    c.company_size,
    c.country,
    c.logo_url,
    c.created_at,
    c.is_active,
    c.deactivated_at,
    (SELECT COUNT(*) FROM public.company_members cm WHERE cm.company_id = c.id)::bigint as member_count,
    COALESCE(p.full_name, 'Sin propietario') as owner_name,
    COALESCE(p.email, '') as owner_email
  FROM public.companies c
  LEFT JOIN public.company_members cm_owner ON cm_owner.company_id = c.id AND cm_owner.role = 'owner'
  LEFT JOIN public.profiles p ON p.user_id = cm_owner.user_id
  ORDER BY c.created_at DESC;
END;
$$;

-- Función para eliminar empresa y TODOS sus datos relacionados
CREATE OR REPLACE FUNCTION public.delete_company_cascade(target_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  member_user_ids uuid[];
BEGIN
  -- Solo permitir a administradores
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden eliminar empresas';
  END IF;
  
  -- Verificar que la empresa existe
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = target_company_id) THEN
    RAISE EXCEPTION 'Empresa no encontrada';
  END IF;
  
  -- Obtener todos los user_ids de miembros de esta empresa
  SELECT array_agg(user_id) INTO member_user_ids
  FROM public.company_members
  WHERE company_id = target_company_id;
  
  -- Eliminar datos relacionados con la empresa (en orden de dependencias)
  
  -- 1. Agentes y configuraciones de agentes
  DELETE FROM public.agent_usage_log WHERE company_id = target_company_id;
  DELETE FROM public.company_agent_configurations WHERE company_id = target_company_id;
  DELETE FROM public.company_agents WHERE company_id = target_company_id;
  DELETE FROM public.company_enabled_agents WHERE company_id = target_company_id;
  DELETE FROM public.company_agent_preferences WHERE company_id = target_company_id;
  
  -- 2. Equipos de AI Workforce
  DELETE FROM public.ai_workforce_team_tasks WHERE team_id IN (
    SELECT id FROM public.ai_workforce_teams WHERE company_id = target_company_id
  );
  DELETE FROM public.ai_workforce_team_members WHERE team_id IN (
    SELECT id FROM public.ai_workforce_teams WHERE company_id = target_company_id
  );
  DELETE FROM public.ai_workforce_teams WHERE company_id = target_company_id;
  
  -- 3. Branding y estrategia
  DELETE FROM public.company_branding WHERE company_id = target_company_id;
  DELETE FROM public.company_strategy WHERE company_id = target_company_id;
  DELETE FROM public.company_digital_presence WHERE company_id = target_company_id;
  DELETE FROM public.company_communication_settings WHERE company_id = target_company_id;
  
  -- 4. Audiencias y competidores
  DELETE FROM public.company_audiences WHERE company_id = target_company_id;
  DELETE FROM public.company_competitors WHERE company_id = target_company_id;
  
  -- 5. Email y configuraciones
  DELETE FROM public.company_inbound_emails WHERE company_id = target_company_id;
  DELETE FROM public.company_inbound_email_config WHERE company_id = target_company_id;
  DELETE FROM public.company_email_config WHERE company_id = target_company_id;
  
  -- 6. Métricas y snapshots
  DELETE FROM public.business_health_snapshots WHERE company_id = target_company_id;
  DELETE FROM public.company_dashboard_metrics WHERE user_id = ANY(member_user_ids);
  
  -- 7. Invitaciones
  DELETE FROM public.company_invitations WHERE company_id = target_company_id;
  
  -- 8. Limpiar primary_company_id de profiles de los miembros
  UPDATE public.profiles 
  SET primary_company_id = NULL 
  WHERE primary_company_id = target_company_id;
  
  -- 9. Eliminar membresías
  DELETE FROM public.company_members WHERE company_id = target_company_id;
  
  -- 10. Finalmente eliminar la empresa
  DELETE FROM public.companies WHERE id = target_company_id;
  
  RETURN true;
END;
$$;