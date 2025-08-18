-- Crear registro de onboarding para el usuario existente que no lo tiene
INSERT INTO public.user_onboarding_status (
  user_id,
  dna_empresarial_completed,
  first_login_completed,
  onboarding_started_at,
  registration_method
)
SELECT 
  p.user_id,
  false,
  false,
  now(),
  p.auth_provider
FROM public.profiles p
LEFT JOIN public.user_onboarding_status uo ON p.user_id = uo.user_id
WHERE uo.user_id IS NULL;