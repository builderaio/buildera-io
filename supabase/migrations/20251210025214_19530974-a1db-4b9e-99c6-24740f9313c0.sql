-- Create company_parameters table for centralized agent data sharing
CREATE TABLE public.company_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Category for grouping parameters
  category TEXT NOT NULL, -- 'strategy', 'content', 'audience', 'branding', 'analytics', 'competitive'
  
  -- Unique parameter key
  parameter_key TEXT NOT NULL,
  
  -- Parameter value (JSONB for flexibility)
  parameter_value JSONB NOT NULL,
  
  -- Source metadata
  source_agent_code TEXT,
  source_execution_id UUID REFERENCES public.agent_usage_log(id),
  
  -- Version control
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Indexes for fast queries
CREATE INDEX idx_company_params_company ON public.company_parameters(company_id);
CREATE INDEX idx_company_params_category ON public.company_parameters(company_id, category);
CREATE INDEX idx_company_params_current ON public.company_parameters(company_id, is_current) WHERE is_current = true;
CREATE INDEX idx_company_params_key ON public.company_parameters(company_id, parameter_key) WHERE is_current = true;

-- Unique constraint for current parameters (only one current value per key per company)
CREATE UNIQUE INDEX idx_unique_current_param ON public.company_parameters(company_id, parameter_key) WHERE is_current = true;

-- Enable RLS
ALTER TABLE public.company_parameters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company members can view parameters"
ON public.company_parameters FOR SELECT
USING (company_id IN (
  SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
));

CREATE POLICY "Company admins can insert parameters"
ON public.company_parameters FOR INSERT
WITH CHECK (company_id IN (
  SELECT cm.company_id FROM public.company_members cm 
  WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
));

CREATE POLICY "Company admins can update parameters"
ON public.company_parameters FOR UPDATE
USING (company_id IN (
  SELECT cm.company_id FROM public.company_members cm 
  WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
));

CREATE POLICY "Company admins can delete parameters"
ON public.company_parameters FOR DELETE
USING (company_id IN (
  SELECT cm.company_id FROM public.company_members cm 
  WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
));

CREATE POLICY "Service role full access to parameters"
ON public.company_parameters FOR ALL
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_company_parameters_updated_at
BEFORE UPDATE ON public.company_parameters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_trigger();

-- View for easy access to current parameters
CREATE VIEW public.company_current_parameters AS
SELECT 
  company_id,
  category,
  parameter_key,
  parameter_value,
  source_agent_code,
  source_execution_id,
  version,
  updated_at
FROM public.company_parameters
WHERE is_current = true;