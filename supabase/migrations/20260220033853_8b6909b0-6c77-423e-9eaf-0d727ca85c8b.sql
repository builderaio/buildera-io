
-- ═══════════════════════════════════════════════════════════════
-- FASE 1: Hook Templates Library
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.marketing_hook_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier INTEGER NOT NULL DEFAULT 1,
  tier_name TEXT NOT NULL,
  hook_text TEXT NOT NULL,
  hook_description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  platform_optimized TEXT[] DEFAULT '{}',
  views_reference TEXT,
  example_caption TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_hook_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hook templates are readable by authenticated users"
  ON public.marketing_hook_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Index for fast category/tier queries
CREATE INDEX idx_hook_templates_category_tier ON public.marketing_hook_templates(category, tier);
CREATE INDEX idx_hook_templates_language ON public.marketing_hook_templates(language);

-- ═══════════════════════════════════════════════════════════════
-- FASE 3: Marketing Feedback Loop Diagnostic
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.marketing_diagnostic_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_id TEXT,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Metrics
  total_views BIGINT DEFAULT 0,
  total_engagements BIGINT DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  views_level TEXT CHECK (views_level IN ('high', 'low')),
  conversions_level TEXT CHECK (conversions_level IN ('high', 'low')),
  
  -- Diagnostic result
  diagnostic_action TEXT CHECK (diagnostic_action IN ('scale_it', 'fix_cta', 'fix_hooks', 'full_reset')),
  diagnostic_reasoning TEXT,
  recommended_actions JSONB DEFAULT '[]',
  
  -- Per-platform breakdown
  platform_breakdown JSONB DEFAULT '{}',
  
  -- Thresholds used
  views_threshold BIGINT DEFAULT 1000,
  conversions_threshold INTEGER DEFAULT 10,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_diagnostic_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company diagnostics"
  ON public.marketing_diagnostic_snapshots FOR SELECT
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert diagnostics"
  ON public.marketing_diagnostic_snapshots FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_diagnostic_snapshots_company ON public.marketing_diagnostic_snapshots(company_id, snapshot_date DESC);
