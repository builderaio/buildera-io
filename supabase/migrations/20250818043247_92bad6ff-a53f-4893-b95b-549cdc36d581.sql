-- Fix PostgREST relationship between company_members and profiles
-- 1) Ensure profiles.user_id is unique so it can be referenced
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'public.profiles'::regclass 
      AND contype = 'u' 
      AND conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 2) Drop FK from company_members.user_id -> auth.users(id) if it exists (we will reference profiles instead)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='company_members' 
      AND constraint_name='fk_company_members_user_id'
  ) THEN
    ALTER TABLE public.company_members DROP CONSTRAINT fk_company_members_user_id;
  END IF;
END $$;

-- 3) Create FK from company_members.user_id -> public.profiles(user_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='company_members' 
      AND constraint_name='company_members_user_id_fkey'
  ) THEN
    ALTER TABLE public.company_members
      ADD CONSTRAINT company_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;