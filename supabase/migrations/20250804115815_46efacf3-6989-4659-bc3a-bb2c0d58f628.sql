-- Primero, hacer que user_type sea nullable para usuarios sociales
ALTER TABLE public.profiles ALTER COLUMN user_type DROP NOT NULL;

-- Corregir el perfil existente que fue mal categorizado
UPDATE public.profiles 
SET auth_provider = 'google', user_type = NULL
WHERE user_id = '61c9818f-39fe-41ab-9fe2-eb03a83fb06a';

-- Corregir onboarding status
UPDATE public.user_onboarding_status 
SET registration_method = 'social'
WHERE user_id = '61c9818f-39fe-41ab-9fe2-eb03a83fb06a';

-- Eliminar la empresa creada incorrectamente (porque este usuario social debería completar perfil)
DELETE FROM public.company_members WHERE user_id = '61c9818f-39fe-41ab-9fe2-eb03a83fb06a';
DELETE FROM public.companies WHERE created_by = '61c9818f-39fe-41ab-9fe2-eb03a83fb06a';