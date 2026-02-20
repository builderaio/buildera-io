
-- =====================================================
-- Strategic Gaps Tracking Table
-- Persists each detected gap with its lifecycle
-- =====================================================
CREATE TABLE public.company_strategic_gaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  gap_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  variable TEXT NOT NULL DEFAULT 'general',
  source TEXT NOT NULL DEFAULT 'diagnostic',
  impact_weight INTEGER NOT NULL DEFAULT 1,
  urgency TEXT NOT NULL DEFAULT 'medium',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, gap_key)
);

-- =====================================================
-- Weekly Decisions Table
-- Persists weekly decisions with 7-day rotation
-- =====================================================
CREATE TABLE public.company_weekly_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  decision_key TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  action_view TEXT,
  variable TEXT NOT NULL DEFAULT 'general',
  source TEXT NOT NULL DEFAULT 'diagnostic',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, week_start, decision_key)
);

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX idx_strategic_gaps_company ON public.company_strategic_gaps(company_id);
CREATE INDEX idx_strategic_gaps_active ON public.company_strategic_gaps(company_id) WHERE resolved_at IS NULL;
CREATE INDEX idx_weekly_decisions_company_week ON public.company_weekly_decisions(company_id, week_start);

-- =====================================================
-- Updated_at trigger for gaps
-- =====================================================
CREATE TRIGGER update_company_strategic_gaps_updated_at
  BEFORE UPDATE ON public.company_strategic_gaps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();

-- =====================================================
-- RLS: company_strategic_gaps
-- =====================================================
ALTER TABLE public.company_strategic_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gaps of their companies"
  ON public.company_strategic_gaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_strategic_gaps.company_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert gaps for their companies"
  ON public.company_strategic_gaps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_strategic_gaps.company_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update gaps of their companies"
  ON public.company_strategic_gaps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_strategic_gaps.company_id
        AND cm.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS: company_weekly_decisions
-- =====================================================
ALTER TABLE public.company_weekly_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view decisions of their companies"
  ON public.company_weekly_decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_weekly_decisions.company_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert decisions for their companies"
  ON public.company_weekly_decisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_weekly_decisions.company_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update decisions of their companies"
  ON public.company_weekly_decisions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_weekly_decisions.company_id
        AND cm.user_id = auth.uid()
    )
  );
