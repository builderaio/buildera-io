-- ============================================================
-- 1) AutoDM Monitors
-- ============================================================
CREATE TABLE IF NOT EXISTS public.autodm_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  company_username TEXT NOT NULL,
  monitor_id TEXT,
  post_url TEXT NOT NULL,
  reply_message TEXT NOT NULL,
  trigger_keywords TEXT[] DEFAULT '{}',
  monitoring_interval INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','paused','stopped','expired','error')),
  dms_sent_total INTEGER NOT NULL DEFAULT 0,
  dms_sent_today INTEGER NOT NULL DEFAULT 0,
  last_check_at TIMESTAMPTZ,
  last_dm_at TIMESTAMPTZ,
  last_error TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autodm_monitors_company ON public.autodm_monitors(company_id);
CREATE INDEX IF NOT EXISTS idx_autodm_monitors_status ON public.autodm_monitors(status);
CREATE INDEX IF NOT EXISTS idx_autodm_monitors_monitor_id ON public.autodm_monitors(monitor_id);

ALTER TABLE public.autodm_monitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view company autodm monitors" ON public.autodm_monitors FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = autodm_monitors.company_id AND cm.user_id = auth.uid()) OR public.current_user_is_admin());
CREATE POLICY "Members can insert company autodm monitors" ON public.autodm_monitors FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = autodm_monitors.company_id AND cm.user_id = auth.uid()));
CREATE POLICY "Members can update company autodm monitors" ON public.autodm_monitors FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = autodm_monitors.company_id AND cm.user_id = auth.uid()));
CREATE POLICY "Members can delete company autodm monitors" ON public.autodm_monitors FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = autodm_monitors.company_id AND cm.user_id = auth.uid()));

CREATE TRIGGER trg_autodm_monitors_updated_at
BEFORE UPDATE ON public.autodm_monitors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

-- ============================================================
-- 2) AutoDM Monitor Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.autodm_monitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES public.autodm_monitors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  comment_id TEXT,
  commenter_user_id TEXT,
  commenter_username TEXT,
  message_sent TEXT,
  matched_keyword TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','skipped')),
  error_message TEXT,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autodm_logs_monitor ON public.autodm_monitor_logs(monitor_id);
CREATE INDEX IF NOT EXISTS idx_autodm_logs_company ON public.autodm_monitor_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_autodm_logs_created ON public.autodm_monitor_logs(created_at DESC);

ALTER TABLE public.autodm_monitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view company autodm logs" ON public.autodm_monitor_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = autodm_monitor_logs.company_id AND cm.user_id = auth.uid()) OR public.current_user_is_admin());

-- ============================================================
-- 3) Upload-Post Webhook Events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.upload_post_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  job_id TEXT,
  profile_username TEXT,
  user_email TEXT,
  platform TEXT,
  account_name TEXT,
  status TEXT,
  reason TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id UUID,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_company ON public.upload_post_webhook_events(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user ON public.upload_post_webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.upload_post_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON public.upload_post_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_job ON public.upload_post_webhook_events(job_id);

ALTER TABLE public.upload_post_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view company webhook events" ON public.upload_post_webhook_events FOR SELECT
  USING (
    (company_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = upload_post_webhook_events.company_id AND cm.user_id = auth.uid()))
    OR (user_id IS NOT NULL AND user_id = auth.uid())
    OR public.current_user_is_admin()
  );

-- ============================================================
-- 4) Cross-post auto-resize rules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.social_autoresize_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  target_aspect_ratio TEXT NOT NULL DEFAULT '9:16',
  target_width INTEGER,
  target_height INTEGER,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, platform)
);

ALTER TABLE public.social_autoresize_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage company autoresize rules" ON public.social_autoresize_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = social_autoresize_rules.company_id AND cm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = social_autoresize_rules.company_id AND cm.user_id = auth.uid()));

CREATE TRIGGER trg_autoresize_rules_updated_at
BEFORE UPDATE ON public.social_autoresize_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

-- ============================================================
-- 5) Catálogo de capabilities nuevas (platform_agents)
-- ============================================================
INSERT INTO public.platform_agents (
  internal_code, name, description, category, agent_type, execution_type,
  edge_function_name, is_active, instructions, tools_config, credits_per_use,
  is_premium, min_plan_required
) VALUES
(
  'AUTODM_MONITOR',
  'AutoDM Manager (Instagram)',
  'Captura leads 24/7 enviando DM automático a quien comente con palabras clave en posts de Instagram.',
  'community',
  'static',
  'edge_function',
  'upload-post-manager',
  true,
  'Activa, pausa o detiene monitores AutoDM en posts de Instagram para responder con DM privado a comentarios que contengan palabras clave (lead magnet, descuento, link, guía, etc.).',
  '{"primary_endpoint": "upload-post-manager", "actions": ["start_autodm_monitor", "stop_autodm_monitor", "pause_autodm_monitor", "resume_autodm_monitor", "list_autodm_monitors"], "platform": "instagram"}'::jsonb,
  5,
  false,
  'free'
),
(
  'CROSS_POST_AUTORESIZE',
  'Smart Cross-Poster',
  'Adapta el video al formato óptimo de cada red (9:16, 1:1, 16:9) antes de publicar en multi-plataforma.',
  'content',
  'static',
  'edge_function',
  'autopilot-post-publisher',
  true,
  'Antes de publicar, transforma el video a la relación de aspecto óptima de cada plataforma usando FFmpeg. Maximiza el alcance sin re-edición manual.',
  '{"primary_endpoint": "autopilot-post-publisher", "actions": ["smart_cross_post"], "platforms": ["tiktok","instagram","youtube","facebook","linkedin","x","threads"]}'::jsonb,
  3,
  false,
  'free'
)
ON CONFLICT (internal_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  instructions = EXCLUDED.instructions,
  tools_config = EXCLUDED.tools_config,
  is_active = true,
  updated_at = now();