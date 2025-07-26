-- Crear tablas para el sistema de agentes de IA
CREATE TABLE public.agent_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instructions_template TEXT NOT NULL,
    tools_config JSONB DEFAULT '[]'::jsonb,
    permissions_template JSONB DEFAULT '{}'::jsonb,
    category TEXT NOT NULL DEFAULT 'general',
    pricing_model TEXT NOT NULL DEFAULT 'free',
    pricing_amount NUMERIC DEFAULT 0,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    version TEXT NOT NULL DEFAULT '1.0.0',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para agent_templates
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para agent_templates (solo admins pueden gestionar)
CREATE POLICY "Admins can manage agent templates" 
ON public.agent_templates 
FOR ALL 
USING (true);

-- Crear tabla para instancias de agentes
CREATE TABLE public.agent_instances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES public.agent_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    contextualized_instructions TEXT NOT NULL,
    tenant_config JSONB DEFAULT '{}'::jsonb,
    tools_permissions JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'terminated')),
    openai_agent_id TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para agent_instances
ALTER TABLE public.agent_instances ENABLE ROW LEVEL SECURITY;

-- Políticas para agent_instances
CREATE POLICY "Users can view their own agent instances" 
ON public.agent_instances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent instances" 
ON public.agent_instances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent instances" 
ON public.agent_instances 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent instances" 
ON public.agent_instances 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear tabla para misiones de agentes
CREATE TABLE public.agent_missions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_instance_id UUID NOT NULL REFERENCES public.agent_instances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    mission_context JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    results JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    openai_run_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para agent_missions
ALTER TABLE public.agent_missions ENABLE ROW LEVEL SECURITY;

-- Políticas para agent_missions
CREATE POLICY "Users can view their own agent missions" 
ON public.agent_missions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent missions" 
ON public.agent_missions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent missions" 
ON public.agent_missions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent missions" 
ON public.agent_missions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear tabla para logs de agentes
CREATE TABLE public.agent_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_instance_id UUID REFERENCES public.agent_instances(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES public.agent_missions(id) ON DELETE CASCADE,
    log_level TEXT NOT NULL DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warning', 'error')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para agent_logs
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Política para agent_logs (los usuarios pueden ver logs de sus agentes)
CREATE POLICY "Users can view logs of their agents" 
ON public.agent_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.agent_instances ai 
        WHERE ai.id = agent_logs.agent_instance_id 
        AND ai.user_id = auth.uid()
    )
);

-- Crear tabla para archivos de conocimiento de agentes
CREATE TABLE public.agent_knowledge_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_instance_id UUID NOT NULL REFERENCES public.agent_instances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    description TEXT,
    openai_file_id TEXT,
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para agent_knowledge_files
ALTER TABLE public.agent_knowledge_files ENABLE ROW LEVEL SECURITY;

-- Políticas para agent_knowledge_files
CREATE POLICY "Users can view their own agent knowledge files" 
ON public.agent_knowledge_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent knowledge files" 
ON public.agent_knowledge_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent knowledge files" 
ON public.agent_knowledge_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent knowledge files" 
ON public.agent_knowledge_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para updated_at
CREATE TRIGGER update_agent_templates_updated_at
    BEFORE UPDATE ON public.agent_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_instances_updated_at
    BEFORE UPDATE ON public.agent_instances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_missions_updated_at
    BEFORE UPDATE ON public.agent_missions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_knowledge_files_updated_at
    BEFORE UPDATE ON public.agent_knowledge_files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Crear índices para mejor rendimiento
CREATE INDEX idx_agent_instances_user_id ON public.agent_instances(user_id);
CREATE INDEX idx_agent_instances_template_id ON public.agent_instances(template_id);
CREATE INDEX idx_agent_missions_agent_instance_id ON public.agent_missions(agent_instance_id);
CREATE INDEX idx_agent_missions_user_id ON public.agent_missions(user_id);
CREATE INDEX idx_agent_missions_status ON public.agent_missions(status);
CREATE INDEX idx_agent_logs_agent_instance_id ON public.agent_logs(agent_instance_id);
CREATE INDEX idx_agent_logs_mission_id ON public.agent_logs(mission_id);
CREATE INDEX idx_agent_knowledge_files_agent_instance_id ON public.agent_knowledge_files(agent_instance_id);