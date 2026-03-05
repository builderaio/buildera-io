
CREATE TABLE public.agentic_maturity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  business_model_score INTEGER DEFAULT 0,
  operating_model_score INTEGER DEFAULT 0,
  governance_score INTEGER DEFAULT 0,
  workforce_score INTEGER DEFAULT 0,
  technology_data_score INTEGER DEFAULT 0,
  composite_score INTEGER DEFAULT 0,
  pillar_details JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agentic_maturity_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company maturity scores"
  ON public.agentic_maturity_scores
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company maturity scores"
  ON public.agentic_maturity_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
    )
  );

CREATE INDEX idx_agentic_maturity_company_date ON public.agentic_maturity_scores(company_id, recorded_at DESC);
