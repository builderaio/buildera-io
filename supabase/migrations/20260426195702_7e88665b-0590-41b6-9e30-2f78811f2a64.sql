ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS mission TEXT,
  ADD COLUMN IF NOT EXISTS primary_challenge TEXT,
  ADD COLUMN IF NOT EXISTS dna_setup_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dna_setup_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recommended_agent_code TEXT;

COMMENT ON COLUMN public.companies.primary_challenge IS 'User-selected primary operational challenge: content|leads|budget|compliance|talent|process';
COMMENT ON COLUMN public.companies.dna_setup_completed IS 'True once the DNA Setup Checklist has been completed for this company';
COMMENT ON COLUMN public.companies.recommended_agent_code IS 'platform_agents.internal_code suggested by AI based on primary_challenge';