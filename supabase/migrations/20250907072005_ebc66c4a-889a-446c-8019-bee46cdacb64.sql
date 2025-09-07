-- Create table for social activity analysis (check if exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'social_activity_analysis') THEN
    CREATE TABLE public.social_activity_analysis (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      platform TEXT NOT NULL,
      cid TEXT NOT NULL,
      peak_hour INTEGER NOT NULL DEFAULT 0,
      peak_day_of_week INTEGER NOT NULL DEFAULT 1,
      peak_interactions NUMERIC(15,2) NOT NULL DEFAULT 0,
      total_interactions NUMERIC(15,2) NOT NULL DEFAULT 0,
      total_likes NUMERIC(15,2) NOT NULL DEFAULT 0,
      total_comments NUMERIC(15,2) NOT NULL DEFAULT 0,
      total_views NUMERIC(15,2) NOT NULL DEFAULT 0,
      total_reposts NUMERIC(15,2) NOT NULL DEFAULT 0,
      avg_interactions_per_hour NUMERIC(10,4) NOT NULL DEFAULT 0,
      avg_likes_per_hour NUMERIC(10,4) NOT NULL DEFAULT 0,
      avg_comments_per_hour NUMERIC(10,4) NOT NULL DEFAULT 0,
      hourly_breakdown JSONB,
      daily_breakdown JSONB,
      raw_activity_data JSONB,
      raw_api_response JSONB,
      analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE(user_id, platform, cid)
    );

    -- Enable Row Level Security
    ALTER TABLE public.social_activity_analysis ENABLE ROW LEVEL SECURITY;

    -- Create policies for user access
    CREATE POLICY "Users can view their own social activity analysis" 
    ON public.social_activity_analysis 
    FOR SELECT 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own social activity analysis" 
    ON public.social_activity_analysis 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own social activity analysis" 
    ON public.social_activity_analysis 
    FOR UPDATE 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own social activity analysis" 
    ON public.social_activity_analysis 
    FOR DELETE 
    USING (auth.uid() = user_id);

    -- Create trigger for automatic timestamp updates
    CREATE TRIGGER update_social_activity_analysis_updated_at
    BEFORE UPDATE ON public.social_activity_analysis
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_trigger();

    -- Create indexes for better performance
    CREATE INDEX idx_social_activity_analysis_user_platform ON public.social_activity_analysis(user_id, platform);
    CREATE INDEX idx_social_activity_analysis_cid ON public.social_activity_analysis(cid);
    CREATE INDEX idx_social_activity_analysis_peak_time ON public.social_activity_analysis(peak_hour, peak_day_of_week);
  END IF;
END $$;