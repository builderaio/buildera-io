-- Create company_digital_presence table for storing digital presence analysis
CREATE TABLE IF NOT EXISTS public.company_digital_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Summary from API
  digital_footprint_summary TEXT,
  -- Analysis arrays (what's working, missing, risks)
  what_is_working JSONB DEFAULT '[]'::jsonb,
  what_is_missing JSONB DEFAULT '[]'::jsonb,
  key_risks JSONB DEFAULT '[]'::jsonb,
  -- Competitive positioning
  competitive_positioning TEXT,
  -- Action plan with short/mid/long term
  action_plan JSONB DEFAULT '{}'::jsonb,
  -- Executive diagnosis with current_state, primary_constraint, highest_leverage_focus
  executive_diagnosis JSONB DEFAULT '{}'::jsonb,
  -- Metadata
  source_url TEXT,
  analyzed_social_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_digital_presence_company_id ON public.company_digital_presence(company_id);

-- Enable RLS
ALTER TABLE public.company_digital_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their company's digital presence data
CREATE POLICY "Users can view their company digital presence"
  ON public.company_digital_presence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_digital_presence.company_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company digital presence"
  ON public.company_digital_presence
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_digital_presence.company_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company digital presence"
  ON public.company_digital_presence
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_digital_presence.company_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company digital presence"
  ON public.company_digital_presence
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_digital_presence.company_id
      AND cm.user_id = auth.uid()
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_digital_presence_updated_at
  BEFORE UPDATE ON public.company_digital_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Allow service role to bypass RLS for edge functions
CREATE POLICY "Service role can manage all digital presence data"
  ON public.company_digital_presence
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');