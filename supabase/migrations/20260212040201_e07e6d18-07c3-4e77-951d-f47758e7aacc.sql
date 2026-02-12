
-- ============================================
-- AUTOPILOT ENGINE: Core Tables
-- ============================================

-- 1. Company Autopilot Configuration
CREATE TABLE public.company_autopilot_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autopilot_enabled BOOLEAN NOT NULL DEFAULT false,
  execution_frequency TEXT NOT NULL DEFAULT '6h' CHECK (execution_frequency IN ('1h','2h','6h','12h','24h')),
  max_posts_per_day INTEGER NOT NULL DEFAULT 3,
  max_credits_per_cycle INTEGER NOT NULL DEFAULT 50,
  require_human_approval BOOLEAN NOT NULL DEFAULT true,
  allowed_actions TEXT[] NOT NULL DEFAULT ARRAY['create_content','publish','reply_comments','adjust_campaigns'],
  brand_guardrails JSONB DEFAULT '{"forbidden_words":[],"tone_rules":[],"topic_restrictions":[]}'::jsonb,
  active_hours JSONB DEFAULT '{"start":"09:00","end":"21:00","timezone":"America/Mexico_City","days":["mon","tue","wed","thu","fri"]}'::jsonb,
  last_execution_at TIMESTAMPTZ,
  next_execution_at TIMESTAMPTZ,
  total_cycles_run INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_autopilot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company autopilot config"
  ON public.company_autopilot_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company autopilot config"
  ON public.company_autopilot_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company autopilot config"
  ON public.company_autopilot_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company autopilot config"
  ON public.company_autopilot_config FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Autopilot Execution Log
CREATE TABLE public.autopilot_execution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL CHECK (phase IN ('sense','think','act','guard','learn')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed','skipped')),
  decisions_made JSONB DEFAULT '[]'::jsonb,
  actions_taken JSONB DEFAULT '[]'::jsonb,
  content_generated INTEGER NOT NULL DEFAULT 0,
  content_approved INTEGER NOT NULL DEFAULT 0,
  content_rejected INTEGER NOT NULL DEFAULT 0,
  content_pending_review INTEGER NOT NULL DEFAULT 0,
  credits_consumed INTEGER NOT NULL DEFAULT 0,
  execution_time_ms INTEGER,
  error_message TEXT,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.autopilot_execution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company autopilot logs"
  ON public.autopilot_execution_log FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_autopilot_config WHERE user_id = auth.uid()
    )
  );

-- Service role inserts (edge function)
CREATE POLICY "Service role can insert autopilot logs"
  ON public.autopilot_execution_log FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_autopilot_log_company ON public.autopilot_execution_log(company_id, created_at DESC);
CREATE INDEX idx_autopilot_log_cycle ON public.autopilot_execution_log(cycle_id);

-- 3. Autopilot Decisions
CREATE TABLE public.autopilot_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL,
  decision_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  description TEXT NOT NULL,
  reasoning TEXT,
  agent_to_execute TEXT,
  action_parameters JSONB,
  action_taken BOOLEAN NOT NULL DEFAULT false,
  guardrail_result TEXT CHECK (guardrail_result IN ('passed','blocked','sent_to_approval')),
  guardrail_details TEXT,
  expected_impact JSONB,
  actual_impact JSONB,
  impact_evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.autopilot_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company autopilot decisions"
  ON public.autopilot_decisions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_autopilot_config WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert autopilot decisions"
  ON public.autopilot_decisions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update autopilot decisions"
  ON public.autopilot_decisions FOR UPDATE
  USING (true);

CREATE INDEX idx_autopilot_decisions_company ON public.autopilot_decisions(company_id, created_at DESC);
CREATE INDEX idx_autopilot_decisions_cycle ON public.autopilot_decisions(cycle_id);

-- 4. Social Automation Rules (persisted)
CREATE TABLE public.social_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('new_comment','new_follower','keyword_detected','sentiment_negative','engagement_drop','mention','new_dm')),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL CHECK (action_type IN ('ai_reply','send_dm','create_post','notify_team','add_to_journey','tag_contact','escalate')),
  action_config JSONB DEFAULT '{}'::jsonb,
  platforms TEXT[] DEFAULT ARRAY['instagram','facebook','linkedin','tiktok'],
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  cooldown_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own social automation rules"
  ON public.social_automation_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social automation rules"
  ON public.social_automation_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social automation rules"
  ON public.social_automation_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social automation rules"
  ON public.social_automation_rules FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_social_rules_company ON public.social_automation_rules(company_id, is_active);

-- Triggers for updated_at
CREATE TRIGGER update_company_autopilot_config_updated_at
  BEFORE UPDATE ON public.company_autopilot_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_automation_rules_updated_at
  BEFORE UPDATE ON public.social_automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
