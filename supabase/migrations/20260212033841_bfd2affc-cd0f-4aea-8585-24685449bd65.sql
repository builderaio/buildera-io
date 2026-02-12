
-- =============================================
-- SMART LINKS: Micro-landing pages with forms
-- =============================================
CREATE TABLE public.smart_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  destination_url TEXT,
  template_type TEXT NOT NULL DEFAULT 'email_capture',
  form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  page_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  utm_params JSONB DEFAULT '{}'::jsonb,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_leads INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_smart_links_company ON public.smart_links(company_id);
CREATE INDEX idx_smart_links_slug ON public.smart_links(slug);

ALTER TABLE public.smart_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company smart links"
  ON public.smart_links FOR SELECT
  USING (company_id IN (
    SELECT id FROM public.companies WHERE created_by = auth.uid()
    UNION
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create smart links for own company"
  ON public.smart_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smart links"
  ON public.smart_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own smart links"
  ON public.smart_links FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- SMART LINK LEADS: Captured contacts
-- =============================================
CREATE TABLE public.smart_link_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.smart_links(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  phone TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  source_platform TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address TEXT,
  user_agent TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_smart_link_leads_link ON public.smart_link_leads(link_id);
CREATE INDEX idx_smart_link_leads_email ON public.smart_link_leads(email);

ALTER TABLE public.smart_link_leads ENABLE ROW LEVEL SECURITY;

-- Leads viewable by smart link owner
CREATE POLICY "Users can view leads for own smart links"
  ON public.smart_link_leads FOR SELECT
  USING (link_id IN (
    SELECT id FROM public.smart_links WHERE user_id = auth.uid()
  ));

-- Public insert for lead capture (no auth required)
CREATE POLICY "Anyone can submit leads"
  ON public.smart_link_leads FOR INSERT
  WITH CHECK (true);

-- =============================================
-- UTM CLICK EVENTS: Track link clicks
-- =============================================
CREATE TABLE public.utm_click_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  smart_link_id UUID REFERENCES public.smart_links(id) ON DELETE SET NULL,
  post_id UUID,
  url TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  device_type TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_utm_clicks_company ON public.utm_click_events(company_id);
CREATE INDEX idx_utm_clicks_campaign ON public.utm_click_events(utm_campaign);
CREATE INDEX idx_utm_clicks_source ON public.utm_click_events(utm_source);
CREATE INDEX idx_utm_clicks_date ON public.utm_click_events(clicked_at);

ALTER TABLE public.utm_click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company utm events"
  ON public.utm_click_events FOR SELECT
  USING (company_id IN (
    SELECT id FROM public.companies WHERE created_by = auth.uid()
    UNION
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
  ));

-- Public insert for click tracking
CREATE POLICY "Anyone can register clicks"
  ON public.utm_click_events FOR INSERT
  WITH CHECK (true);

-- =============================================
-- Triggers for updated_at
-- =============================================
CREATE TRIGGER update_smart_links_updated_at
  BEFORE UPDATE ON public.smart_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
