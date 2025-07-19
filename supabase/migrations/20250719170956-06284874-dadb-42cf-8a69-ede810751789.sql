-- Crear tabla para trackear el estado de tutoriales/onboarding del usuario
CREATE TABLE public.user_tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tutorial_name TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, tutorial_name)
);

-- Enable RLS
ALTER TABLE public.user_tutorials ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own tutorials"
ON public.user_tutorials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorials"
ON public.user_tutorials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutorials"
ON public.user_tutorials
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tutorials"
ON public.user_tutorials
FOR DELETE
USING (auth.uid() = user_id);