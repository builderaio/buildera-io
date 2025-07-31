-- Actualizar el trigger para usar la función asíncrona de webhooks
CREATE OR REPLACE FUNCTION public.handle_new_company_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Si es un usuario tipo company, crear la empresa automáticamente
  IF NEW.raw_user_meta_data->>'user_type' = 'company' THEN
    SELECT public.create_company_with_owner(
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
      NULL,
      NEW.raw_user_meta_data->>'website_url',
      NEW.raw_user_meta_data->>'industry_sector',
      NEW.raw_user_meta_data->>'company_size',
      NEW.id  -- Pasar explícitamente el ID del nuevo usuario
    ) INTO new_company_id;
    
    -- Actualizar el perfil con la empresa principal
    UPDATE public.profiles 
    SET primary_company_id = new_company_id 
    WHERE user_id = NEW.id;
    
    -- Procesar webhooks de forma asíncrona (sin bloquear el registro)
    BEGIN
      PERFORM pg_notify(
        'process_company_webhooks',
        json_build_object(
          'user_id', NEW.id,
          'company_name', COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
          'website_url', NEW.raw_user_meta_data->>'website_url',
          'trigger_type', 'registration'
        )::text
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the registration
        RAISE WARNING 'Error enviando notificación de webhooks: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Crear función para manejar notificaciones de webhooks
CREATE OR REPLACE FUNCTION public.handle_webhook_notification()
RETURNS VOID AS $$
DECLARE
  payload_data JSON;
  webhook_data RECORD;
BEGIN
  -- Esta función se puede usar para procesar notificaciones si es necesario
  -- Por ahora es un placeholder para futuras implementaciones
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';