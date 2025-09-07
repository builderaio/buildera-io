-- Create social_analysis table to store detailed API response data
CREATE TABLE public.social_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Basic profile information
  cid TEXT,
  social_type TEXT NOT NULL,
  group_id TEXT,
  url TEXT NOT NULL,
  name TEXT,
  image TEXT,
  description TEXT,
  screen_name TEXT,
  users_count INTEGER DEFAULT 0,
  community_status TEXT,
  is_blocked BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  
  -- Tags and categorization
  tags TEXT[] DEFAULT '{}',
  suggested_tags TEXT[] DEFAULT '{}',
  rating_tags JSONB DEFAULT '[]',
  categories TEXT[] DEFAULT '{}',
  
  -- Engagement metrics
  avg_er NUMERIC DEFAULT 0,
  avg_interactions INTEGER DEFAULT 0,
  avg_views INTEGER DEFAULT 0,
  rating_index NUMERIC DEFAULT 0,
  quality_score NUMERIC DEFAULT 0,
  
  -- Timing data
  time_statistics TIMESTAMP WITH TIME ZONE,
  time_posts_loaded TIMESTAMP WITH TIME ZONE,
  time_short_loop TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  
  -- Geographic and demographic data
  members_cities JSONB DEFAULT '[]',
  members_countries JSONB DEFAULT '[]',
  members_genders_ages JSONB DEFAULT '{}',
  country TEXT,
  country_code TEXT,
  city TEXT,
  
  -- Profile type and demographics
  profile_type TEXT,
  gender TEXT,
  age TEXT,
  
  -- Content and engagement
  last_posts JSONB DEFAULT '[]',
  last_from_mentions JSONB DEFAULT '[]',
  similar_profiles JSONB DEFAULT '[]',
  
  -- Audience analysis
  members_types JSONB DEFAULT '[]',
  members_reachability JSONB DEFAULT '[]',
  countries JSONB DEFAULT '[]',
  cities JSONB DEFAULT '[]',
  genders JSONB DEFAULT '[]',
  ages JSONB DEFAULT '[]',
  interests JSONB DEFAULT '[]',
  
  -- Safety and authenticity
  brand_safety JSONB DEFAULT '{}',
  pct_fake_followers NUMERIC DEFAULT 0,
  audience_severity NUMERIC DEFAULT 0,
  
  -- Platform-specific fields
  contact_email TEXT, -- Instagram specific
  
  -- Raw API response for backup
  raw_api_response JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own social analysis" 
ON public.social_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social analysis" 
ON public.social_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social analysis" 
ON public.social_analysis 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social analysis" 
ON public.social_analysis 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_social_analysis_updated_at
BEFORE UPDATE ON public.social_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_trigger();

-- Create indexes for better performance
CREATE INDEX idx_social_analysis_user_id ON public.social_analysis(user_id);
CREATE INDEX idx_social_analysis_social_type ON public.social_analysis(social_type);
CREATE INDEX idx_social_analysis_url ON public.social_analysis(url);
CREATE INDEX idx_social_analysis_created_at ON public.social_analysis(created_at);