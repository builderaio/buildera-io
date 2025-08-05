-- Fix all remaining search_path security issues
-- Continue fixing the remaining functions

-- Fix get_user_stats_admin function
CREATE OR REPLACE FUNCTION public.get_user_stats_admin()
 RETURNS TABLE(total_users bigint, companies bigint, developers bigint, experts bigint, active_last_30_days bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_users,
    COUNT(*) FILTER (WHERE user_type = 'company')::bigint as companies,
    COUNT(*) FILTER (WHERE user_type = 'developer')::bigint as developers,
    COUNT(*) FILTER (WHERE user_type = 'expert')::bigint as experts,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::bigint as active_last_30_days
  FROM public.profiles;
END;
$function$;

-- Fix restore_agent_template_version function
CREATE OR REPLACE FUNCTION public.restore_agent_template_version(template_id_param uuid, version_number_param character varying, new_version_param character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  version_data RECORD;
BEGIN
  -- Obtener los datos de la versión a restaurar
  SELECT * INTO version_data
  FROM public.agent_template_versions
  WHERE template_id = template_id_param 
    AND version_number = version_number_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Versión no encontrada';
  END IF;
  
  -- Actualizar la plantilla principal con los datos de la versión
  UPDATE public.agent_templates
  SET
    name = version_data.name,
    description = version_data.description,
    instructions_template = version_data.instructions_template,
    category = version_data.category,
    pricing_model = version_data.pricing_model,
    pricing_amount = version_data.pricing_amount,
    icon = version_data.icon,
    tools_config = version_data.tools_config,
    permissions_template = version_data.permissions_template,
    is_active = version_data.is_active,
    is_featured = version_data.is_featured,
    version = new_version_param,
    updated_at = now()
  WHERE id = template_id_param;
  
  -- Registrar la restauración en el historial
  INSERT INTO public.agent_template_versions (
    template_id,
    version_number,
    name,
    description,
    instructions_template,
    category,
    pricing_model,
    pricing_amount,
    icon,
    tools_config,
    permissions_template,
    is_active,
    is_featured,
    created_by,
    change_notes
  ) VALUES (
    template_id_param,
    new_version_param,
    version_data.name,
    version_data.description,
    version_data.instructions_template,
    version_data.category,
    version_data.pricing_model,
    version_data.pricing_amount,
    version_data.icon,
    version_data.tools_config,
    version_data.permissions_template,
    version_data.is_active,
    version_data.is_featured,
    version_data.created_by,
    'Restauración desde versión ' || version_number_param
  );
  
  RETURN TRUE;
END;
$function$;

-- Fix create_initial_agent_template_version function
CREATE OR REPLACE FUNCTION public.create_initial_agent_template_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Crear la versión inicial
  INSERT INTO public.agent_template_versions (
    template_id,
    version_number,
    name,
    description,
    instructions_template,
    category,
    pricing_model,
    pricing_amount,
    icon,
    tools_config,
    permissions_template,
    is_active,
    is_featured,
    created_by,
    change_notes
  ) VALUES (
    NEW.id,
    NEW.version,
    NEW.name,
    NEW.description,
    NEW.instructions_template,
    NEW.category,
    NEW.pricing_model,
    NEW.pricing_amount,
    NEW.icon,
    NEW.tools_config,
    NEW.permissions_template,
    NEW.is_active,
    NEW.is_featured,
    NEW.created_by,
    'Versión inicial'
  );
  
  RETURN NEW;
END;
$function$;

-- Fix calculate_user_level function
CREATE OR REPLACE FUNCTION public.calculate_user_level(total_points integer)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  -- Cada nivel requiere más puntos exponencialmente
  IF total_points < 100 THEN RETURN 1;
  ELSIF total_points < 300 THEN RETURN 2;
  ELSIF total_points < 600 THEN RETURN 3;
  ELSIF total_points < 1000 THEN RETURN 4;
  ELSIF total_points < 1500 THEN RETURN 5;
  ELSIF total_points < 2100 THEN RETURN 6;
  ELSIF total_points < 2800 THEN RETURN 7;
  ELSIF total_points < 3600 THEN RETURN 8;
  ELSIF total_points < 4500 THEN RETURN 9;
  ELSE RETURN 10;
  END IF;
END;
$function$;

-- Fix create_company_with_owner function (both versions)
CREATE OR REPLACE FUNCTION public.create_company_with_owner(company_name text, company_description text DEFAULT NULL::text, website_url text DEFAULT NULL::text, industry_sector text DEFAULT NULL::text, company_size text DEFAULT NULL::text, user_id_param uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  new_company_id UUID;
  current_user_id UUID;
BEGIN
  -- Usar el parámetro si se proporciona, sino usar auth.uid()
  current_user_id := COALESCE(user_id_param, auth.uid());
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Crear la empresa
  INSERT INTO public.companies (
    name, description, website_url, industry_sector, company_size, created_by
  ) VALUES (
    company_name, company_description, website_url, industry_sector, company_size, current_user_id
  ) RETURNING id INTO new_company_id;
  
  -- Asignar al usuario como owner y empresa principal
  INSERT INTO public.company_members (
    user_id, company_id, role, is_primary
  ) VALUES (
    current_user_id, new_company_id, 'owner', true
  );
  
  RETURN new_company_id;
END;
$function$;

-- Fix calculate_posting_optimal_times function
CREATE OR REPLACE FUNCTION public.calculate_posting_optimal_times(user_id_param uuid, platform_param text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Calcular mejores horarios basado en engagement histórico
  SELECT jsonb_build_object(
    'best_hours', array_agg(DISTINCT hour_of_day ORDER BY hour_of_day),
    'best_days', array_agg(DISTINCT day_of_week ORDER BY day_of_week),
    'avg_engagement', avg(engagement_rate)
  ) INTO result
  FROM public.social_media_calendar
  WHERE user_id = user_id_param 
    AND platform = platform_param
    AND engagement_rate > 0
    AND published_at >= NOW() - INTERVAL '30 days'
  GROUP BY hour_of_day, day_of_week
  HAVING avg(engagement_rate) > (
    SELECT avg(engagement_rate) * 1.1 
    FROM public.social_media_calendar 
    WHERE user_id = user_id_param AND platform = platform_param
  );
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$function$;