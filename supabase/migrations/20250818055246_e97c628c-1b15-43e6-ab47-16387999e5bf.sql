-- Agregar campo current_step a la tabla user_onboarding_status para persistir el paso actual
ALTER TABLE public.user_onboarding_status 
ADD COLUMN current_step INTEGER DEFAULT 1;