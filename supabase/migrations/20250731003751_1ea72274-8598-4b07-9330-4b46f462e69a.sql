-- Eliminar el trigger automático para registros de empresa
-- ya que ahora se manejan manualmente en los momentos específicos

-- Primero eliminar el trigger
DROP TRIGGER IF EXISTS on_company_user_created ON auth.users;

-- Luego eliminar la función con CASCADE para eliminar todas las dependencias
DROP FUNCTION IF EXISTS public.handle_new_company_user() CASCADE;

-- Mantener la función handle_new_user para crear perfiles básicos
-- pero sin el procesamiento de webhooks automático