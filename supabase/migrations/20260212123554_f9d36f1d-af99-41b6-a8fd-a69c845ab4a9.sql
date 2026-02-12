
-- Add new columns to autopilot_capabilities for Capability Genesis Engine
ALTER TABLE public.autopilot_capabilities 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'seeded',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'system_seed',
  ADD COLUMN IF NOT EXISTS auto_activate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS proposed_reason text,
  ADD COLUMN IF NOT EXISTS gap_evidence jsonb;

-- Add check constraint for valid statuses
ALTER TABLE public.autopilot_capabilities
  ADD CONSTRAINT chk_capability_status CHECK (status IN ('seeded', 'proposed', 'trial', 'active', 'deprecated'));

-- Add check constraint for valid sources
ALTER TABLE public.autopilot_capabilities
  ADD CONSTRAINT chk_capability_source CHECK (source IN ('system_seed', 'ai_generated', 'external_signal', 'pattern_detected'));

-- Create index for efficient querying by status
CREATE INDEX IF NOT EXISTS idx_capabilities_status ON public.autopilot_capabilities(company_id, status);
CREATE INDEX IF NOT EXISTS idx_capabilities_trial_expires ON public.autopilot_capabilities(trial_expires_at) WHERE status = 'trial';

-- Update existing capabilities to have correct status based on is_active
UPDATE public.autopilot_capabilities SET status = 'active' WHERE is_active = true AND status = 'seeded';

-- Create function to manage capability lifecycle transitions
CREATE OR REPLACE FUNCTION public.transition_capability_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'trial', set trial_expires_at to 7 days from now
  IF NEW.status = 'trial' AND (OLD.status IS DISTINCT FROM 'trial') THEN
    NEW.trial_expires_at := now() + interval '7 days';
    NEW.activated_at := now();
  END IF;
  
  -- When status changes to 'active'
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    NEW.activated_at := now();
    NEW.is_active := true;
  END IF;
  
  -- When status changes to 'deprecated'
  IF NEW.status = 'deprecated' AND (OLD.status IS DISTINCT FROM 'deprecated') THEN
    NEW.deactivated_at := now();
    NEW.is_active := false;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_capability_status_transition
  BEFORE UPDATE OF status ON public.autopilot_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION public.transition_capability_status();

-- Function to auto-promote trial capabilities after expiry
CREATE OR REPLACE FUNCTION public.promote_trial_capabilities()
RETURNS void AS $$
BEGIN
  UPDATE public.autopilot_capabilities
  SET status = 'active'
  WHERE status = 'trial'
    AND trial_expires_at <= now();
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to auto-deprecate unused active capabilities (30 days no execution)
CREATE OR REPLACE FUNCTION public.deprecate_unused_capabilities()
RETURNS void AS $$
BEGIN
  UPDATE public.autopilot_capabilities
  SET status = 'deprecated'
  WHERE status = 'active'
    AND source = 'ai_generated'
    AND execution_count = 0
    AND updated_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SET search_path = public;
