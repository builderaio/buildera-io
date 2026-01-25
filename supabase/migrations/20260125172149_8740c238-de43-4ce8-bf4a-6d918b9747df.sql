-- Add journey tracking columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS journey_type TEXT DEFAULT 'new_business',
ADD COLUMN IF NOT EXISTS journey_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS journey_current_step INTEGER DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN public.companies.journey_type IS 'Type of onboarding journey: new_business, existing_business, or pivot';
COMMENT ON COLUMN public.companies.journey_completed_at IS 'Timestamp when journey was completed';
COMMENT ON COLUMN public.companies.journey_current_step IS 'Current step in the journey flow';

-- Create index for journey queries
CREATE INDEX IF NOT EXISTS idx_companies_journey_type ON public.companies(journey_type);