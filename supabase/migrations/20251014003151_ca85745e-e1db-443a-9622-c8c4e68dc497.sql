-- Add unique constraint for upsert operations if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'social_retrospective_analysis_user_platform_cid_key'
    ) THEN
        ALTER TABLE public.social_retrospective_analysis 
        ADD CONSTRAINT social_retrospective_analysis_user_platform_cid_key 
        UNIQUE (user_id, platform, cid);
    END IF;
END $$;