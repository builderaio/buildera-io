-- Create company_audiences table for comprehensive audience management
CREATE TABLE public.company_audiences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  
  -- Basic Demographics
  age_ranges jsonb DEFAULT '{}',
  gender_split jsonb DEFAULT '{}',
  income_ranges jsonb DEFAULT '{}',
  education_levels jsonb DEFAULT '{}',
  relationship_status jsonb DEFAULT '{}',
  geographic_locations jsonb DEFAULT '{}',
  
  -- Professional Information
  job_titles jsonb DEFAULT '{}',
  industries jsonb DEFAULT '{}',
  company_sizes jsonb DEFAULT '{}',
  professional_level jsonb DEFAULT '{}',
  
  -- Behavioral Data
  interests jsonb DEFAULT '{}',
  brand_affinities jsonb DEFAULT '{}',
  online_behaviors jsonb DEFAULT '{}',
  purchase_behaviors jsonb DEFAULT '{}',
  content_consumption_habits jsonb DEFAULT '{}',
  device_usage jsonb DEFAULT '{}',
  
  -- Social Media Specific
  platform_preferences jsonb DEFAULT '{}',
  engagement_patterns jsonb DEFAULT '{}',
  active_hours jsonb DEFAULT '{}',
  content_preferences jsonb DEFAULT '{}',
  influencer_following jsonb DEFAULT '{}',
  hashtag_usage jsonb DEFAULT '{}',
  
  -- Pain Points & Motivations
  pain_points text[],
  motivations text[],
  goals text[],
  challenges text[],
  
  -- Business Metrics
  estimated_size integer,
  conversion_potential numeric DEFAULT 0,
  lifetime_value_estimate numeric DEFAULT 0,
  acquisition_cost_estimate numeric DEFAULT 0,
  
  -- Platform-specific targeting
  facebook_targeting jsonb DEFAULT '{}',
  instagram_targeting jsonb DEFAULT '{}',
  linkedin_targeting jsonb DEFAULT '{}',
  tiktok_targeting jsonb DEFAULT '{}',
  twitter_targeting jsonb DEFAULT '{}',
  youtube_targeting jsonb DEFAULT '{}',
  
  -- Custom attributes for advanced segmentation
  custom_attributes jsonb DEFAULT '{}',
  tags text[],
  
  -- Analysis & AI insights
  ai_insights jsonb DEFAULT '{}',
  last_analysis_date timestamp with time zone,
  confidence_score numeric DEFAULT 0,
  
  -- Metadata
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_audiences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Company members can view audiences"
ON public.company_audiences
FOR SELECT
USING (
  company_id IN (
    SELECT cm.company_id 
    FROM company_members cm 
    WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners and admins can manage audiences"
ON public.company_audiences
FOR ALL
USING (
  company_id IN (
    SELECT cm.company_id 
    FROM company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  company_id IN (
    SELECT cm.company_id 
    FROM company_members cm 
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

-- Create indexes for performance
CREATE INDEX idx_company_audiences_company_id ON public.company_audiences(company_id);
CREATE INDEX idx_company_audiences_user_id ON public.company_audiences(user_id);
CREATE INDEX idx_company_audiences_is_active ON public.company_audiences(is_active);
CREATE INDEX idx_company_audiences_created_at ON public.company_audiences(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_company_audiences_updated_at
  BEFORE UPDATE ON public.company_audiences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();