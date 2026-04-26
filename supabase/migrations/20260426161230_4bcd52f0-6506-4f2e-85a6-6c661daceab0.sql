ALTER TABLE public.autopilot_execution_log
  DROP CONSTRAINT IF EXISTS autopilot_execution_log_phase_check;

ALTER TABLE public.autopilot_execution_log
  ADD CONSTRAINT autopilot_execution_log_phase_check
  CHECK (phase = ANY (ARRAY[
    'sense'::text,
    'think'::text,
    'act'::text,
    'guard'::text,
    'learn'::text,
    'evolve'::text,
    'preflight'::text,
    'complete_cycle'::text,
    'guardrail_intervention'::text,
    'capability_lifecycle'::text
  ]));

NOTIFY pgrst, 'reload schema';