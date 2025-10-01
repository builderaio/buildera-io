-- Create SFIA skills catalog table
CREATE TABLE IF NOT EXISTS public.sfia_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(4) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  level_1_description TEXT,
  level_2_description TEXT,
  level_3_description TEXT,
  level_4_description TEXT,
  level_5_description TEXT,
  level_6_description TEXT,
  level_7_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create AI Workforce Agents table
CREATE TABLE IF NOT EXISTS public.ai_workforce_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_id VARCHAR(100) NOT NULL UNIQUE,
  role_name TEXT NOT NULL,
  description TEXT,
  avatar_icon TEXT,
  avatar_url TEXT,
  primary_function TEXT,
  key_skills_summary TEXT[], -- Simplified skills for user display
  sfia_skills JSONB DEFAULT '[]'::jsonb, -- Array of {skill_code, level, custom_description}
  average_sfia_level NUMERIC(3,1),
  execution_type TEXT CHECK (execution_type IN ('n8n_workflow', 'ai_chain', 'api_endpoint', 'edge_function')),
  execution_resource_id TEXT, -- URL or ID of the resource
  input_parameters JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create AI Workforce Teams table
CREATE TABLE IF NOT EXISTS public.ai_workforce_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  mission_objective TEXT NOT NULL,
  mission_type TEXT, -- 'marketing_campaign', 'content_generation', etc.
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create AI Workforce Team Members (junction table)
CREATE TABLE IF NOT EXISTS public.ai_workforce_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.ai_workforce_teams(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_workforce_agents(id) ON DELETE CASCADE,
  role_in_team TEXT, -- Custom role name if needed
  assigned_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ,
  tasks_completed INTEGER DEFAULT 0,
  UNIQUE(team_id, agent_id)
);

-- Create AI Workforce Team Tasks table
CREATE TABLE IF NOT EXISTS public.ai_workforce_team_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.ai_workforce_teams(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.ai_workforce_agents(id),
  task_name TEXT NOT NULL,
  task_description TEXT,
  task_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  input_data JSONB,
  output_data JSONB,
  execution_log JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.sfia_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workforce_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workforce_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workforce_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workforce_team_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SFIA skills (read-only for all authenticated users)
CREATE POLICY "SFIA skills are viewable by authenticated users"
  ON public.sfia_skills FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for AI Workforce Agents
CREATE POLICY "Active agents are viewable by authenticated users"
  ON public.ai_workforce_agents FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage agents"
  ON public.ai_workforce_agents FOR ALL
  TO authenticated
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- RLS Policies for AI Workforce Teams
CREATE POLICY "Users can view their own teams"
  ON public.ai_workforce_teams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own teams"
  ON public.ai_workforce_teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teams"
  ON public.ai_workforce_teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own teams"
  ON public.ai_workforce_teams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for Team Members
CREATE POLICY "Users can view members of their teams"
  ON public.ai_workforce_team_members FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT id FROM public.ai_workforce_teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage members of their teams"
  ON public.ai_workforce_team_members FOR ALL
  TO authenticated
  USING (team_id IN (SELECT id FROM public.ai_workforce_teams WHERE user_id = auth.uid()))
  WITH CHECK (team_id IN (SELECT id FROM public.ai_workforce_teams WHERE user_id = auth.uid()));

-- RLS Policies for Team Tasks
CREATE POLICY "Users can view tasks of their teams"
  ON public.ai_workforce_team_tasks FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT id FROM public.ai_workforce_teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can create tasks for their teams"
  ON public.ai_workforce_team_tasks FOR INSERT
  TO authenticated
  WITH CHECK (team_id IN (SELECT id FROM public.ai_workforce_teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can update tasks of their teams"
  ON public.ai_workforce_team_tasks FOR UPDATE
  TO authenticated
  USING (team_id IN (SELECT id FROM public.ai_workforce_teams WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_ai_workforce_agents_internal_id ON public.ai_workforce_agents(internal_id);
CREATE INDEX idx_ai_workforce_agents_is_active ON public.ai_workforce_agents(is_active);
CREATE INDEX idx_ai_workforce_teams_user_id ON public.ai_workforce_teams(user_id);
CREATE INDEX idx_ai_workforce_teams_company_id ON public.ai_workforce_teams(company_id);
CREATE INDEX idx_ai_workforce_team_members_team_id ON public.ai_workforce_team_members(team_id);
CREATE INDEX idx_ai_workforce_team_members_agent_id ON public.ai_workforce_team_members(agent_id);
CREATE INDEX idx_ai_workforce_team_tasks_team_id ON public.ai_workforce_team_tasks(team_id);

-- Insert some sample SFIA skills
INSERT INTO public.sfia_skills (code, name, category, subcategory, description, level_4_description, level_5_description) VALUES
('STRG', 'Planificación estratégica', 'Estrategia y arquitectura', 'Planificación', 'La creación y el mantenimiento de estrategias de alto nivel para alinear las inversiones organizacionales con los objetivos empresariales.', 'Analiza las tendencias del mercado y las capacidades organizacionales para informar la planificación estratégica.', 'Define y comunica la estrategia organizacional y asegura la alineación con los objetivos del negocio.'),
('MRKT', 'Marketing digital', 'Relaciones y compromiso', 'Comunicación', 'La investigación, análisis, creación y distribución de contenido para lograr los objetivos de marketing.', 'Aplica técnicas de marketing digital para implementar campañas efectivas en diversos canales.', 'Define la estrategia de marketing digital y supervisa la implementación de campañas complejas.'),
('DTAN', 'Análisis de datos', 'Desarrollo y implementación', 'Análisis', 'La investigación, especificación y el diseño de soluciones para transformar datos en información útil.', 'Aplica técnicas de análisis de datos para establecer y verificar los requisitos del negocio y especificar soluciones eficaces.', 'Define metodologías de análisis de datos y guía a otros en la aplicación de técnicas avanzadas.'),
('CONT', 'Creación de contenido', 'Relaciones y compromiso', 'Comunicación', 'La planificación, diseño y creación de contenido textual, gráfico y multimedia.', 'Crea contenido atractivo y efectivo para diversos formatos y audiencias, siguiendo estándares de calidad.', 'Define estrategias de contenido y establece estándares y directrices para la creación de contenido.'),
('BPRE', 'Análisis empresarial', 'Estrategia y arquitectura', 'Planificación', 'La investigación, identificación y definición de nuevas oportunidades de negocio.', 'Analiza procesos empresariales y recomienda mejoras basadas en datos y mejores prácticas.', 'Define metodologías de análisis empresarial y lidera la transformación de procesos complejos.'),
('BURM', 'Gestión de relaciones empresariales', 'Relaciones y compromiso', 'Stakeholder', 'El desarrollo y gestión de relaciones efectivas entre proveedores y clientes.', 'Gestiona relaciones empresariales clave y facilita la comunicación entre stakeholders.', 'Establece estrategias de gestión de relaciones y mantiene alianzas estratégicas complejas.')
ON CONFLICT (code) DO NOTHING;

-- Create update trigger
CREATE OR REPLACE FUNCTION update_ai_workforce_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_workforce_agents_updated_at
  BEFORE UPDATE ON public.ai_workforce_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_workforce_updated_at();

CREATE TRIGGER update_ai_workforce_teams_updated_at
  BEFORE UPDATE ON public.ai_workforce_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_workforce_updated_at();