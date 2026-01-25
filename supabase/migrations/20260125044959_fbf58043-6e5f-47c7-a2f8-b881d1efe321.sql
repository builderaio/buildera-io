-- ================================================================
-- COMPANY OBJECTIVE PROGRESS TRACKING
-- Tracks progress towards business objectives for strategic dashboard
-- ================================================================

CREATE TABLE public.company_objective_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  objective_id UUID REFERENCES public.company_objectives(id) ON DELETE CASCADE,
  progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  metrics_snapshot JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_company_objective_progress_company ON public.company_objective_progress(company_id);
CREATE INDEX idx_company_objective_progress_objective ON public.company_objective_progress(objective_id);

-- Enable RLS
ALTER TABLE public.company_objective_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company members can view objective progress"
  ON public.company_objective_progress
  FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Company admins can manage objective progress"
  ON public.company_objective_progress
  FOR ALL
  USING (company_id IN (
    SELECT cm.company_id FROM company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  ));

-- ================================================================
-- BUSINESS HEALTH SNAPSHOTS
-- Daily/weekly snapshots of business KPIs for trend analysis
-- ================================================================

CREATE TABLE public.business_health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_type TEXT DEFAULT 'daily' CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),
  
  -- Core KPIs
  efficiency_score NUMERIC DEFAULT 0,
  digital_reach INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  estimated_conversions INTEGER DEFAULT 0,
  
  -- Agent metrics
  agent_hours_saved NUMERIC DEFAULT 0,
  agent_executions INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,
  
  -- Content metrics
  posts_published INTEGER DEFAULT 0,
  content_engagement NUMERIC DEFAULT 0,
  
  -- Full data snapshot
  detailed_metrics JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure one snapshot per company per date per type
  UNIQUE(company_id, snapshot_date, snapshot_type)
);

-- Indexes for time-series queries
CREATE INDEX idx_business_health_snapshots_company_date ON public.business_health_snapshots(company_id, snapshot_date DESC);
CREATE INDEX idx_business_health_snapshots_type ON public.business_health_snapshots(snapshot_type);

-- Enable RLS
ALTER TABLE public.business_health_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company members can view health snapshots"
  ON public.business_health_snapshots
  FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Company admins can manage health snapshots"
  ON public.business_health_snapshots
  FOR ALL
  USING (company_id IN (
    SELECT cm.company_id FROM company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  ));

-- Trigger for updated_at on objective progress
CREATE TRIGGER update_company_objective_progress_updated_at
  BEFORE UPDATE ON public.company_objective_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();