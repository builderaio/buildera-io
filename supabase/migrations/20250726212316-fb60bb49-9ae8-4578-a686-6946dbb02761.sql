-- Crear tablas para integraciones de email
CREATE TABLE IF NOT EXISTS public.email_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agent_instances(id) ON DELETE CASCADE,
    email_address TEXT NOT NULL,
    imap_server TEXT NOT NULL,
    smtp_server TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_validation',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tablas para configuraciones de widgets
CREATE TABLE IF NOT EXISTS public.widget_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agent_instances(id) ON DELETE CASCADE,
    widget_id TEXT NOT NULL UNIQUE,
    primary_color TEXT DEFAULT '#3b82f6',
    company_logo TEXT,
    company_name TEXT,
    widget_type TEXT NOT NULL DEFAULT 'embedded_chat',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tablas para configuraciones de dashboard
CREATE TABLE IF NOT EXISTS public.dashboard_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agent_instances(id) ON DELETE CASCADE,
    dashboard_id TEXT NOT NULL UNIQUE,
    access_level TEXT NOT NULL DEFAULT 'company_admin',
    analytics_enabled BOOLEAN NOT NULL DEFAULT true,
    real_time_updates BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_configurations ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para email_integrations
CREATE POLICY "Users can view their own email integrations" 
ON public.email_integrations 
FOR SELECT 
USING (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

CREATE POLICY "Users can insert their own email integrations" 
ON public.email_integrations 
FOR INSERT 
WITH CHECK (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

CREATE POLICY "Users can update their own email integrations" 
ON public.email_integrations 
FOR UPDATE 
USING (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

CREATE POLICY "Users can delete their own email integrations" 
ON public.email_integrations 
FOR DELETE 
USING (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

-- Crear políticas RLS para widget_configurations
CREATE POLICY "Users can view their own widget configurations" 
ON public.widget_configurations 
FOR SELECT 
USING (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

CREATE POLICY "Users can insert their own widget configurations" 
ON public.widget_configurations 
FOR INSERT 
WITH CHECK (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

CREATE POLICY "Users can update their own widget configurations" 
ON public.widget_configurations 
FOR UPDATE 
USING (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

CREATE POLICY "Users can delete their own widget configurations" 
ON public.widget_configurations 
FOR DELETE 
USING (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

-- Crear políticas RLS para dashboard_configurations
CREATE POLICY "Users can view their own dashboard configurations" 
ON public.dashboard_configurations 
FOR SELECT 
USING (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

CREATE POLICY "Users can insert their own dashboard configurations" 
ON public.dashboard_configurations 
FOR INSERT 
WITH CHECK (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

CREATE POLICY "Users can update their own dashboard configurations" 
ON public.dashboard_configurations 
FOR UPDATE 
USING (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

CREATE POLICY "Users can delete their own dashboard configurations" 
ON public.dashboard_configurations 
FOR DELETE 
USING (
    auth.uid() IN (
        SELECT ai.user_id 
        FROM public.agent_instances ai 
        WHERE ai.id = agent_id
    )
);

-- Crear trigger para updated_at
CREATE TRIGGER update_email_integrations_updated_at
    BEFORE UPDATE ON public.email_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widget_configurations_updated_at
    BEFORE UPDATE ON public.widget_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_configurations_updated_at
    BEFORE UPDATE ON public.dashboard_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();