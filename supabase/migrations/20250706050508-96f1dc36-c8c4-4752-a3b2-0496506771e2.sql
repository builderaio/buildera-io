-- Crear perfil para el usuario existente que no tiene perfil
INSERT INTO public.profiles (
  user_id,
  email, 
  full_name,
  user_type
)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  CAST(COALESCE(raw_user_meta_data->>'user_type', 'company') AS public.user_type)
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.profiles);