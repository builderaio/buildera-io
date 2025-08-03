-- Crear tabla para almacenar agentes empresariales personalizados
CREATE TABLE public.company_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  instructions TEXT NOT NULL,
  tools JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.company_agents ENABLE ROW LEVEL SECURITY;

-- Create policies for company_agents
CREATE POLICY "Users can view their own company agents"
ON public.company_agents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own company agents"
ON public.company_agents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company agents"
ON public.company_agents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company agents"
ON public.company_agents
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_company_agents_updated_at
BEFORE UPDATE ON public.company_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();