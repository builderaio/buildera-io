
-- ══════════════════════════════════════
-- 1. AUTOMATION EXECUTION LOG
-- ══════════════════════════════════════
CREATE TABLE public.automation_execution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.social_automation_rules(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_payload JSONB DEFAULT '{}',
  action_result JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'executed',
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_execution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company automation logs"
  ON public.automation_execution_log FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE INDEX idx_automation_exec_company ON public.automation_execution_log(company_id);
CREATE INDEX idx_automation_exec_rule ON public.automation_execution_log(rule_id);
CREATE INDEX idx_automation_exec_created ON public.automation_execution_log(created_at DESC);

-- ══════════════════════════════════════
-- 2. SOCIAL LISTENING EVENTS (persistent)
-- ══════════════════════════════════════
CREATE TABLE public.social_listening_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'mention', 'competitor_ad', 'keyword_alert'
  platform TEXT NOT NULL,
  source_url TEXT,
  source_username TEXT,
  content_text TEXT,
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  sentiment_score NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_actioned BOOLEAN NOT NULL DEFAULT false,
  actioned_by UUID REFERENCES auth.users(id),
  actioned_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_listening_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company listening events"
  ON public.social_listening_events FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their company listening events"
  ON public.social_listening_events FOR UPDATE
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE INDEX idx_listening_events_company ON public.social_listening_events(company_id);
CREATE INDEX idx_listening_events_type ON public.social_listening_events(event_type);
CREATE INDEX idx_listening_events_sentiment ON public.social_listening_events(sentiment);
CREATE INDEX idx_listening_events_detected ON public.social_listening_events(detected_at DESC);

-- ══════════════════════════════════════
-- 3. ADD auto_published TO content_approvals
-- ══════════════════════════════════════
ALTER TABLE public.content_approvals
  ADD COLUMN IF NOT EXISTS auto_published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id);

-- ══════════════════════════════════════
-- 4. CONTENT APPROVAL STATE MACHINE TRIGGER
-- Prevents invalid transitions and enforces approved->published
-- ══════════════════════════════════════
CREATE OR REPLACE FUNCTION public.validate_content_approval_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "draft": ["pending_review"],
    "pending_review": ["approved", "rejected"],
    "approved": ["published"],
    "rejected": ["draft", "pending_review"],
    "published": []
  }'::jsonb;
  allowed_next JSONB;
BEGIN
  -- Skip if status didn't change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  allowed_next := valid_transitions -> OLD.status;

  IF allowed_next IS NULL OR NOT (allowed_next ? NEW.status) THEN
    RAISE EXCEPTION 'Invalid content approval transition from "%" to "%"', OLD.status, NEW.status;
  END IF;

  -- Auto-set published_at when transitioning to published
  IF NEW.status = 'published' AND OLD.status = 'approved' THEN
    NEW.published_at := COALESCE(NEW.published_at, now());
    NEW.published_by := COALESCE(NEW.published_by, auth.uid());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_validate_content_approval_transition
  BEFORE UPDATE ON public.content_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_content_approval_transition();

-- ══════════════════════════════════════
-- 5. SOCIAL LISTENING CONFIGURATION (per company)
-- ══════════════════════════════════════
CREATE TABLE public.social_listening_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  keywords TEXT[] DEFAULT '{}',
  competitor_handles TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT ARRAY['instagram', 'facebook', 'linkedin', 'tiktok'],
  alert_on_negative BOOLEAN NOT NULL DEFAULT true,
  alert_on_competitor_ad BOOLEAN NOT NULL DEFAULT true,
  alert_threshold INTEGER NOT NULL DEFAULT 3,
  scan_frequency_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.social_listening_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company listening config"
  ON public.social_listening_config FOR ALL
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));
