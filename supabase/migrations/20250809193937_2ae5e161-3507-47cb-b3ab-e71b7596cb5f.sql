-- Fix provider detection and registration method in handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  extracted_user_type text;
  final_user_type public.user_type;
  new_company_id uuid;
  primary_provider text;
  providers text[];
BEGIN
  -- Determine primary provider with priority: raw_app_meta_data.provider -> auth.identities -> 'email'
  primary_provider := NULLIF(NEW.raw_app_meta_data->>'provider', '');

  IF primary_provider IS NULL THEN
    SELECT provider 
    INTO primary_provider
    FROM auth.identities
    WHERE user_id = NEW.id AND provider != 'email'
    LIMIT 1;
  END IF;

  IF primary_provider IS NULL OR primary_provider = '' THEN
    primary_provider := 'email';
  END IF;

  -- Linked providers array
  IF primary_provider = 'email' THEN
    providers := ARRAY['email'];
  ELSE
    providers := ARRAY[primary_provider];
  END IF;

  -- Extract user_type from raw_user_meta_data, with inference fallbacks
  extracted_user_type := NEW.raw_user_meta_data->>'user_type';
  IF extracted_user_type IS NULL THEN
    IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
      extracted_user_type := 'company';
    ELSIF NEW.raw_user_meta_data->>'github_url' IS NOT NULL OR NEW.raw_user_meta_data->>'skills' IS NOT NULL THEN
      extracted_user_type := 'developer';
    ELSIF NEW.raw_user_meta_data->>'industry' IS NOT NULL OR NEW.raw_user_meta_data->>'expertise_areas' IS NOT NULL THEN
      extracted_user_type := 'expert';
    ELSE
      extracted_user_type := 'company';
    END IF;
  END IF;

  CASE extracted_user_type
    WHEN 'company' THEN final_user_type := 'company'::public.user_type;
    WHEN 'developer' THEN final_user_type := 'developer'::public.user_type;
    WHEN 'expert' THEN final_user_type := 'expert'::public.user_type;
    ELSE final_user_type := 'company'::public.user_type;
  END CASE;

  -- Create user profile with correct provider info
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    auth_provider,
    linked_providers,
    user_type,
    company_name,
    website_url,
    industry
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    primary_provider,
    providers,
    final_user_type,
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'website_url',
    NEW.raw_user_meta_data->>'industry'
  );

  -- If company user and company data present, auto-create company and set membership
  IF final_user_type = 'company'::public.user_type AND NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    INSERT INTO public.companies (
      name,
      description,
      website_url,
      industry_sector,
      company_size,
      country,
      created_by
    )
    VALUES (
      NEW.raw_user_meta_data->>'company_name',
      NULL,
      NEW.raw_user_meta_data->>'website_url',
      NEW.raw_user_meta_data->>'industry_sector',
      NEW.raw_user_meta_data->>'company_size',
      NEW.raw_user_meta_data->>'country',
      NEW.id
    )
    RETURNING id INTO new_company_id;

    INSERT INTO public.company_members (
      user_id,
      company_id,
      role,
      is_primary
    ) VALUES (
      NEW.id,
      new_company_id,
      'owner',
      true
    );
  END IF;

  -- Create onboarding status with correct registration_method
  INSERT INTO public.user_onboarding_status (
    user_id,
    registration_method,
    onboarding_started_at
  ) VALUES (
    NEW.id,
    CASE WHEN primary_provider = 'email' THEN 'email' ELSE 'social' END,
    now()
  );

  RETURN NEW;
END;
$$;

-- Data correction for existing profiles incorrectly marked as email
-- Update profiles where there is a non-email identity
UPDATE public.profiles p
SET auth_provider = ai.provider,
    linked_providers = ARRAY[ai.provider]
FROM (
  SELECT user_id, MIN(provider) AS provider
  FROM auth.identities
  WHERE provider != 'email'
  GROUP BY user_id
) ai
WHERE p.user_id = ai.user_id
  AND (p.auth_provider IS NULL OR p.auth_provider = 'email');

-- Update onboarding registration_method to social when appropriate
UPDATE public.user_onboarding_status uos
SET registration_method = 'social'
FROM (
  SELECT user_id, MIN(provider) AS provider
  FROM auth.identities
  WHERE provider != 'email'
  GROUP BY user_id
) ai
WHERE uos.user_id = ai.user_id
  AND (uos.registration_method IS NULL OR uos.registration_method = 'email');