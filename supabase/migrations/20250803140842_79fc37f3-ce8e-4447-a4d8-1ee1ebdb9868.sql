-- Crear tabla para tracking del estado de onboarding de usuarios
CREATE TABLE IF NOT EXISTS public.user_onboarding_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dna_empresarial_completed BOOLEAN DEFAULT FALSE,
  marketing_hub_visited BOOLEAN DEFAULT FALSE,
  first_login_completed BOOLEAN DEFAULT FALSE,
  registration_method TEXT, -- 'email', 'google', 'linkedin_oidc'
  onboarding_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_onboarding_status ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_onboarding_status
CREATE POLICY "Users can view their own onboarding status"
  ON public.user_onboarding_status
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding status"
  ON public.user_onboarding_status
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding status"
  ON public.user_onboarding_status
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_onboarding_status_updated_at
  BEFORE UPDATE ON public.user_onboarding_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para marcar onboarding como completado
CREATE OR REPLACE FUNCTION public.mark_onboarding_completed(
  _user_id UUID,
  _registration_method TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_onboarding_status (
    user_id,
    dna_empresarial_completed,
    first_login_completed,
    registration_method,
    onboarding_completed_at
  )
  VALUES (
    _user_id,
    TRUE,
    TRUE,
    _registration_method,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    dna_empresarial_completed = TRUE,
    onboarding_completed_at = now(),
    registration_method = COALESCE(EXCLUDED.registration_method, user_onboarding_status.registration_method),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;