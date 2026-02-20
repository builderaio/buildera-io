
-- ═══════════════════════════════════════════════════════════════════
-- STRATEGIC STATE ENGINE: Versioned strategic snapshots
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.company_strategic_state_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Core strategic state
  maturity_stage TEXT NOT NULL DEFAULT 'early' CHECK (maturity_stage IN ('early', 'growth', 'consolidated', 'scale')),
  business_model TEXT CHECK (business_model IN ('b2b', 'b2c', 'b2b2c', 'mixed', NULL)),
  
  -- DNA snapshot (frozen at point-in-time)
  strategic_dna_snapshot JSONB NOT NULL DEFAULT '{}',
  
  -- Aggregated state
  active_gaps JSONB NOT NULL DEFAULT '[]',
  resolved_gaps JSONB NOT NULL DEFAULT '[]',
  structural_risks JSONB NOT NULL DEFAULT '[]',
  capability_index NUMERIC NOT NULL DEFAULT 0,
  
  -- Scores at time of snapshot
  sdi_score INTEGER NOT NULL DEFAULT 0,
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  
  -- Trigger metadata
  trigger_reason TEXT NOT NULL DEFAULT 'manual',
  triggered_by TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique version per company
CREATE UNIQUE INDEX idx_strategic_state_company_version 
  ON public.company_strategic_state_snapshots(company_id, version);

CREATE INDEX idx_strategic_state_company_latest 
  ON public.company_strategic_state_snapshots(company_id, created_at DESC);

ALTER TABLE public.company_strategic_state_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their company state snapshots"
  ON public.company_strategic_state_snapshots FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Members can insert state snapshots"
  ON public.company_strategic_state_snapshots FOR INSERT
  WITH CHECK (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════
-- SCORE HISTORY: Longitudinal SDI tracking
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.company_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  sdi_score INTEGER NOT NULL,
  foundation_score INTEGER NOT NULL DEFAULT 0,
  presence_score INTEGER NOT NULL DEFAULT 0,
  execution_score INTEGER NOT NULL DEFAULT 0,
  gaps_score INTEGER NOT NULL DEFAULT 0,
  
  -- Dynamic weight adjustments applied
  weight_adjustments JSONB DEFAULT '{}',
  
  -- Consistency tracking
  weeks_below_threshold JSONB DEFAULT '{}',
  consistency_bonus INTEGER NOT NULL DEFAULT 0,
  stagnation_penalty INTEGER NOT NULL DEFAULT 0,
  
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_score_history_company_time 
  ON public.company_score_history(company_id, recorded_at DESC);

ALTER TABLE public.company_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their company score history"
  ON public.company_score_history FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Members can insert score history"
  ON public.company_score_history FOR INSERT
  WITH CHECK (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════
-- STRATEGIC MEMORY LAYER: Decision impact + pattern tracking
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.company_strategic_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Decision reference
  decision_id UUID REFERENCES public.company_weekly_decisions(id) ON DELETE SET NULL,
  gap_id UUID REFERENCES public.company_strategic_gaps(id) ON DELETE SET NULL,
  
  -- What happened
  action_type TEXT NOT NULL, -- 'decision_completed', 'gap_resolved', 'dna_updated', 'score_change'
  action_key TEXT NOT NULL,
  action_description TEXT,
  
  -- Impact measurement
  sdi_before INTEGER,
  sdi_after INTEGER,
  sdi_delta INTEGER GENERATED ALWAYS AS (COALESCE(sdi_after, 0) - COALESCE(sdi_before, 0)) STORED,
  
  dimension_impacted TEXT, -- which variable/pillar was affected
  impact_magnitude TEXT CHECK (impact_magnitude IN ('high', 'medium', 'low', 'none')),
  
  -- Pattern classification
  behavioral_pattern TEXT, -- e.g. 'quick-executor', 'strategic-planner', 'reactive'
  maturity_stage_at_time TEXT,
  business_model_at_time TEXT,
  
  -- Context snapshot (lightweight)
  context_snapshot JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_strategic_memory_company 
  ON public.company_strategic_memory(company_id, created_at DESC);

CREATE INDEX idx_strategic_memory_pattern 
  ON public.company_strategic_memory(company_id, behavioral_pattern);

ALTER TABLE public.company_strategic_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their company strategic memory"
  ON public.company_strategic_memory FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Members can insert strategic memory"
  ON public.company_strategic_memory FOR INSERT
  WITH CHECK (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════
-- ENHANCE EXISTING GAP TABLE: Add lifecycle fields
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.company_strategic_gaps
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'operational',
  ADD COLUMN IF NOT EXISTS severity_weight NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS linked_priority_id TEXT,
  ADD COLUMN IF NOT EXISTS resolution_impact_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resolution_evidence TEXT,
  ADD COLUMN IF NOT EXISTS weeks_active INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: Auto-increment strategic state version
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.next_strategic_state_version(p_company_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(version), 0) + 1
  FROM public.company_strategic_state_snapshots
  WHERE company_id = p_company_id
$$;

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: Get weeks a dimension has been below threshold
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_dimension_stagnation(
  p_company_id UUID,
  p_dimension TEXT,
  p_threshold INTEGER DEFAULT 40
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH weekly_scores AS (
    SELECT 
      date_trunc('week', recorded_at) AS week,
      CASE p_dimension
        WHEN 'foundation' THEN foundation_score
        WHEN 'presence' THEN presence_score
        WHEN 'execution' THEN execution_score
        WHEN 'gaps' THEN gaps_score
        ELSE sdi_score
      END AS score
    FROM public.company_score_history
    WHERE company_id = p_company_id
    ORDER BY recorded_at DESC
    LIMIT 12
  )
  SELECT COUNT(*)::INTEGER
  FROM weekly_scores
  WHERE score < p_threshold
$$;
