-- Create marketing campaigns table
CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  business_objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create buyer personas table
CREATE TABLE public.buyer_personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  fictional_name TEXT NOT NULL,
  professional_role TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create marketing strategies table
CREATE TABLE public.marketing_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  unified_message TEXT,
  competitive_analysis JSONB NOT NULL DEFAULT '[]',
  marketing_funnel JSONB NOT NULL DEFAULT '{}',
  content_plan JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create content calendar items table
CREATE TABLE public.content_calendar_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID NOT NULL REFERENCES public.marketing_strategies(id) ON DELETE CASCADE,
  publish_date DATE NOT NULL,
  publish_time TIME,
  social_network TEXT NOT NULL,
  content_details JSONB NOT NULL DEFAULT '{}',
  final_copy TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create generated assets table
CREATE TABLE public.generated_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_item_id UUID NOT NULL REFERENCES public.content_calendar_items(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'reel')),
  asset_url TEXT,
  prompt_used TEXT,
  creative_assets JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can manage their own marketing campaigns" 
ON public.marketing_campaigns 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage buyer personas" 
ON public.buyer_personas 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage marketing strategies" 
ON public.marketing_strategies 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage content calendar items" 
ON public.content_calendar_items 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage generated assets" 
ON public.generated_assets 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_buyer_personas_campaign_id ON public.buyer_personas(campaign_id);
CREATE INDEX idx_marketing_strategies_campaign_id ON public.marketing_strategies(campaign_id);
CREATE INDEX idx_content_calendar_items_strategy_id ON public.content_calendar_items(strategy_id);
CREATE INDEX idx_content_calendar_items_publish_date ON public.content_calendar_items(publish_date);
CREATE INDEX idx_generated_assets_calendar_item_id ON public.generated_assets(calendar_item_id);