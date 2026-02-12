
-- Create creatify_jobs table
CREATE TABLE public.creatify_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('url_to_video', 'avatar', 'ad_clone', 'iab_images', 'asset_generator', 'ai_script', 'text_to_speech')),
  creatify_job_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_queue', 'running', 'done', 'failed')),
  input_params JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  credits_used INTEGER DEFAULT 0,
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  calendar_item_id UUID REFERENCES public.content_calendar_items(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creatify_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view jobs from their company
CREATE POLICY "Users can view their company creatify jobs"
ON public.creatify_jobs FOR SELECT
USING (
  company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  )
);

-- Users can create jobs for their company
CREATE POLICY "Users can create creatify jobs for their company"
ON public.creatify_jobs FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  )
);

-- Users can update their own jobs
CREATE POLICY "Users can update their own creatify jobs"
ON public.creatify_jobs FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete their own creatify jobs"
ON public.creatify_jobs FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_creatify_jobs_updated_at
BEFORE UPDATE ON public.creatify_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_trigger();

-- Index for common queries
CREATE INDEX idx_creatify_jobs_company_id ON public.creatify_jobs(company_id);
CREATE INDEX idx_creatify_jobs_status ON public.creatify_jobs(status);
CREATE INDEX idx_creatify_jobs_user_id ON public.creatify_jobs(user_id);
