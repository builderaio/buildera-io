-- First, add the missing columns to marketing_campaigns table
ALTER TABLE public.marketing_campaigns 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS draft_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS current_step text DEFAULT 'objective',
ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS last_saved_at timestamp with time zone DEFAULT now();

-- Create or update the updated_at trigger for marketing_campaigns
CREATE OR REPLACE FUNCTION update_marketing_campaigns_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_saved_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at_trigger ON public.marketing_campaigns;
CREATE TRIGGER update_marketing_campaigns_updated_at_trigger
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_campaigns_updated_at();

-- Create index for better performance on draft campaigns
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_user_draft 
ON public.marketing_campaigns (user_id, is_draft, updated_at DESC);