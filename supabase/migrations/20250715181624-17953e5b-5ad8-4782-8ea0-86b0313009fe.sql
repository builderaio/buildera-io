-- Eliminar todos los perfiles de la tabla profiles
DELETE FROM public.profiles;

-- Nota: Los usuarios en auth.users se eliminarán automáticamente cuando se eliminen desde el dashboard de Supabase
-- o puedes eliminarlos manualmente desde el dashboard en Authentication > Users