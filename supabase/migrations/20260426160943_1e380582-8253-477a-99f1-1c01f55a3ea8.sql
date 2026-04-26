ALTER TABLE public.department_execution_log
  ADD COLUMN IF NOT EXISTS content_generated integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_approved integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_rejected integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_pending_review integer NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';