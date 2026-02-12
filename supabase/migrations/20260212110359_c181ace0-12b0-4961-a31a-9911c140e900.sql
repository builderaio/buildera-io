
-- ═══════════════════════════════════════════════════════════════
-- ENTERPRISE AUTOPILOT BRAIN: Memory, Intelligence & Capabilities
-- ═══════════════════════════════════════════════════════════════

-- 1. AUTOPILOT MEMORY (adaptive learning from past decisions)
CREATE TABLE public.autopilot_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department TEXT NOT NULL DEFAULT 'marketing',
  cycle_id TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  context_hash TEXT,
  context_summary TEXT,
  outcome_score NUMERIC DEFAULT 0,
  outcome_evaluation TEXT DEFAULT 'pending',
  lesson_learned TEXT,
  applies_to_future JSONB DEFAULT '[]'::jsonb,
  external_signal_used BOOLEAN DEFAULT false,
  external_signal_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluated_at TIMESTAMPTZ
);

ALTER TABLE public.autopilot_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company autopilot memory"
  ON public.autopilot_memory FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage autopilot memory"
  ON public.autopilot_memory FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX idx_autopilot_memory_company_dept ON public.autopilot_memory(company_id, department);
CREATE INDEX idx_autopilot_memory_context_hash ON public.autopilot_memory(context_hash);
CREATE INDEX idx_autopilot_memory_outcome ON public.autopilot_memory(outcome_evaluation);

-- 2. EXTERNAL INTELLIGENCE CACHE (market, industry, macro signals)
CREATE TABLE public.external_intelligence_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('market_trends','industry_news','macroeconomic','technology','regulatory','competitor')),
  region TEXT,
  industry_sector TEXT,
  query_used TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  structured_signals JSONB DEFAULT '[]'::jsonb,
  relevance_score NUMERIC DEFAULT 0.5,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  is_processed BOOLEAN DEFAULT false,
  triggered_actions JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.external_intelligence_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company intelligence"
  ON public.external_intelligence_cache FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage intelligence cache"
  ON public.external_intelligence_cache FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX idx_ext_intel_company ON public.external_intelligence_cache(company_id);
CREATE INDEX idx_ext_intel_source ON public.external_intelligence_cache(source);
CREATE INDEX idx_ext_intel_expires ON public.external_intelligence_cache(expires_at);

-- 3. AUTOPILOT CAPABILITIES (auto-evolving feature flags)
CREATE TABLE public.autopilot_capabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  capability_code TEXT NOT NULL,
  capability_name TEXT NOT NULL,
  description TEXT,
  trigger_condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_maturity TEXT NOT NULL DEFAULT 'starter',
  required_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT false,
  activated_at TIMESTAMPTZ,
  activation_reason TEXT,
  deactivated_at TIMESTAMPTZ,
  last_evaluated_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, capability_code)
);

ALTER TABLE public.autopilot_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company capabilities"
  ON public.autopilot_capabilities FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage capabilities"
  ON public.autopilot_capabilities FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX idx_capabilities_company_dept ON public.autopilot_capabilities(company_id, department);
CREATE INDEX idx_capabilities_active ON public.autopilot_capabilities(company_id, is_active);

-- Trigger for updated_at
CREATE TRIGGER update_autopilot_capabilities_updated_at
  BEFORE UPDATE ON public.autopilot_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
