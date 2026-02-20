
-- 1. Create marketing_strategic_impact table
CREATE TABLE public.marketing_strategic_impact (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'campaign_created', 'post_published', 'automation_activated', 'engagement_spike', 'conversion', 'onboarding_step'
  event_source TEXT NOT NULL, -- 'campaign', 'autopilot', 'manual', 'automation_rule', 'onboarding'
  source_id TEXT, -- campaign_id, post_id, rule_id
  strategic_dimension TEXT NOT NULL, -- 'brand', 'acquisition', 'authority', 'operations'
  gap_id UUID REFERENCES public.company_strategic_gaps(id) ON DELETE SET NULL,
  snapshot_version INTEGER,
  sdi_before INTEGER NOT NULL DEFAULT 0,
  sdi_after INTEGER NOT NULL DEFAULT 0,
  dimension_delta JSONB DEFAULT '{}'::jsonb,
  evidence JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_strategic_impact_company ON public.marketing_strategic_impact(company_id, created_at DESC);
CREATE INDEX idx_marketing_strategic_impact_dimension ON public.marketing_strategic_impact(strategic_dimension);
CREATE INDEX idx_marketing_strategic_impact_gap ON public.marketing_strategic_impact(gap_id) WHERE gap_id IS NOT NULL;

-- 2. Add strategic columns to scheduled_posts
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS strategic_dimension TEXT,
  ADD COLUMN IF NOT EXISTS linked_gap_id UUID;

-- 3. RLS for marketing_strategic_impact
ALTER TABLE public.marketing_strategic_impact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company marketing impact"
  ON public.marketing_strategic_impact FOR SELECT
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert marketing impact for their company"
  ON public.marketing_strategic_impact FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
    )
  );
