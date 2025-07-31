-- Eliminar el trigger automático para registros de empresa
-- ya que ahora se manejan manualmente en los momentos específicos

-- Primero eliminar el trigger
DROP TRIGGER IF EXISTS handle_new_company_user_trigger ON auth.users;

-- Luego eliminar la función ya que no la necesitamos
DROP FUNCTION IF EXISTS public.handle_new_company_user();

-- Mantener la función handle_new_user para crear perfiles básicos
-- pero sin el procesamiento de webhooks automático