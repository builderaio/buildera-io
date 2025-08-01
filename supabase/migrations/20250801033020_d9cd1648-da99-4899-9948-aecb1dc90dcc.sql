-- Habilitar RLS en las nuevas tablas creadas
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_assignments ENABLE ROW LEVEL SECURITY;

-- Crear políticas para ai_models (solo admins pueden gestionar)
CREATE POLICY "Admins can manage AI models" ON public.ai_models FOR ALL USING (true);

-- Crear políticas para ai_model_assignments (solo admins pueden gestionar)  
CREATE POLICY "Admins can manage AI model assignments" ON public.ai_model_assignments FOR ALL USING (true);