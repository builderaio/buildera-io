
-- Content Approvals table
CREATE TABLE public.content_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'post',
  content_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published')),
  submitted_by UUID REFERENCES auth.users(id),
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_comments TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals for their company"
  ON public.content_approvals FOR SELECT
  USING (
    company_id IN (
      SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create approvals for their company"
  ON public.content_approvals FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update approvals for their company"
  ON public.content_approvals FOR UPDATE
  USING (
    company_id IN (
      SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete approvals for their company"
  ON public.content_approvals FOR DELETE
  USING (
    submitted_by = auth.uid()
  );

CREATE TRIGGER update_content_approvals_updated_at
  BEFORE UPDATE ON public.content_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
