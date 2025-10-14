-- Add missing fields to marketing_campaigns table
ALTER TABLE public.marketing_campaigns 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
ADD COLUMN IF NOT EXISTS campaign_name TEXT,
ADD COLUMN IF NOT EXISTS campaign_description TEXT,
ADD COLUMN IF NOT EXISTS campaign_type TEXT DEFAULT 'awareness';

-- Add comprehensive fields to marketing_strategies table
ALTER TABLE public.marketing_strategies
ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS execution_plan JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS sources TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS risks_assumptions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS message_variants JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS full_strategy_data JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create trigger function for updated_at if not exists
CREATE OR REPLACE FUNCTION update_marketing_strategies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_marketing_strategies_updated_at_trigger 
  ON public.marketing_strategies;
  
CREATE TRIGGER update_marketing_strategies_updated_at_trigger
  BEFORE UPDATE ON public.marketing_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_strategies_updated_at();

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_company_user 
  ON public.marketing_campaigns(company_id, user_id, status);
  
CREATE INDEX IF NOT EXISTS idx_marketing_strategies_updated 
  ON public.marketing_strategies(campaign_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_name_search
  ON public.marketing_campaigns(user_id, campaign_name);

-- Add comment for documentation
COMMENT ON COLUMN public.marketing_strategies.full_strategy_data IS 'Stores complete N8N API response for reusability';
COMMENT ON COLUMN public.marketing_strategies.message_variants IS 'Platform-specific message variants (LinkedIn, Instagram, TikTok)';
COMMENT ON COLUMN public.marketing_strategies.updated_at IS 'Auto-updated timestamp for version tracking';