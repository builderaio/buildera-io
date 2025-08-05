-- Corregir el auth_provider y user_type para manuel@buildera.io
UPDATE public.profiles 
SET 
  auth_provider = 'google',
  user_type = NULL,  -- NULL para forzar complete-profile
  linked_providers = ARRAY['google']
WHERE email = 'manuel@buildera.io';