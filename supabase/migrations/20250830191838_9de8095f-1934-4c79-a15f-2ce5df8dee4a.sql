-- First, we need to add a user_id column to marketing_campaigns to link campaigns to users
ALTER TABLE public.marketing_campaigns 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id required for new campaigns
ALTER TABLE public.marketing_campaigns 
ALTER COLUMN user_id SET NOT NULL;

-- Drop the old permissive policies
DROP POLICY "Users can manage their own marketing campaigns" ON public.marketing_campaigns;
DROP POLICY "Users can manage buyer personas" ON public.buyer_personas;
DROP POLICY "Users can manage marketing strategies" ON public.marketing_strategies;
DROP POLICY "Users can manage content calendar items" ON public.content_calendar_items;
DROP POLICY "Users can manage generated assets" ON public.generated_assets;

-- Create proper RLS policies that check user ownership
CREATE POLICY "Users can manage their own marketing campaigns" 
ON public.marketing_campaigns 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage buyer personas for their campaigns" 
ON public.buyer_personas 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.marketing_campaigns mc 
    WHERE mc.id = buyer_personas.campaign_id 
    AND mc.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.marketing_campaigns mc 
    WHERE mc.id = buyer_personas.campaign_id 
    AND mc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage marketing strategies for their campaigns" 
ON public.marketing_strategies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.marketing_campaigns mc 
    WHERE mc.id = marketing_strategies.campaign_id 
    AND mc.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.marketing_campaigns mc 
    WHERE mc.id = marketing_strategies.campaign_id 
    AND mc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage content calendar items for their strategies" 
ON public.content_calendar_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.marketing_strategies ms
    JOIN public.marketing_campaigns mc ON mc.id = ms.campaign_id
    WHERE ms.id = content_calendar_items.strategy_id 
    AND mc.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.marketing_strategies ms
    JOIN public.marketing_campaigns mc ON mc.id = ms.campaign_id
    WHERE ms.id = content_calendar_items.strategy_id 
    AND mc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage generated assets for their content" 
ON public.generated_assets 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.content_calendar_items cci
    JOIN public.marketing_strategies ms ON ms.id = cci.strategy_id
    JOIN public.marketing_campaigns mc ON mc.id = ms.campaign_id
    WHERE cci.id = generated_assets.calendar_item_id 
    AND mc.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.content_calendar_items cci
    JOIN public.marketing_strategies ms ON ms.id = cci.strategy_id
    JOIN public.marketing_campaigns mc ON mc.id = ms.campaign_id
    WHERE cci.id = generated_assets.calendar_item_id 
    AND mc.user_id = auth.uid()
  )
);

-- Add index for better performance on user_id lookups
CREATE INDEX idx_marketing_campaigns_user_id ON public.marketing_campaigns(user_id);