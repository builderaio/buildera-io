-- Add unique constraints for upsert operations on social media posts tables

-- TikTok posts: unique constraint on (user_id, video_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tiktok_posts_user_video_unique'
    ) THEN
        ALTER TABLE public.tiktok_posts 
        ADD CONSTRAINT tiktok_posts_user_video_unique 
        UNIQUE (user_id, video_id);
    END IF;
END $$;

-- Instagram posts: verify constraint on (user_id, post_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'instagram_posts_user_post_unique'
    ) THEN
        ALTER TABLE public.instagram_posts 
        ADD CONSTRAINT instagram_posts_user_post_unique 
        UNIQUE (user_id, post_id);
    END IF;
END $$;

-- LinkedIn posts: verify constraint on (user_id, post_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'linkedin_posts_user_post_unique'
    ) THEN
        ALTER TABLE public.linkedin_posts 
        ADD CONSTRAINT linkedin_posts_user_post_unique 
        UNIQUE (user_id, post_id);
    END IF;
END $$;

-- Facebook posts: verify constraint on (user_id, post_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'facebook_posts_user_post_unique'
    ) THEN
        ALTER TABLE public.facebook_posts 
        ADD CONSTRAINT facebook_posts_user_post_unique 
        UNIQUE (user_id, post_id);
    END IF;
END $$;