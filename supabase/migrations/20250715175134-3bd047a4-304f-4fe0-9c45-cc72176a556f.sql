-- Add authentication method tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN auth_provider text,
ADD COLUMN linked_providers text[] DEFAULT '{}';

-- Add a trigger to automatically set auth_provider when user first logs in
CREATE OR REPLACE FUNCTION public.update_auth_provider()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update if auth_provider is null (first time login)
  IF NEW.auth_provider IS NULL THEN
    -- Check if user has OAuth identities
    IF EXISTS (
      SELECT 1 FROM auth.identities 
      WHERE user_id = NEW.user_id 
      AND provider != 'email'
    ) THEN
      -- Get the first OAuth provider
      SELECT provider INTO NEW.auth_provider
      FROM auth.identities 
      WHERE user_id = NEW.user_id 
      AND provider != 'email'
      LIMIT 1;
      
      -- Also add to linked_providers array
      NEW.linked_providers = ARRAY[NEW.auth_provider];
    ELSE
      -- Email/password registration
      NEW.auth_provider = 'email';
      NEW.linked_providers = ARRAY['email'];
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update auth provider info
DROP TRIGGER IF EXISTS update_auth_provider_trigger ON public.profiles;
CREATE TRIGGER update_auth_provider_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_auth_provider();

-- Function to add a new linked provider
CREATE OR REPLACE FUNCTION public.add_linked_provider(_user_id uuid, _provider text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET linked_providers = array_append(linked_providers, _provider)
  WHERE user_id = _user_id 
  AND NOT (_provider = ANY(linked_providers));
END;
$$;

-- Function to remove a linked provider
CREATE OR REPLACE FUNCTION public.remove_linked_provider(_user_id uuid, _provider text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET linked_providers = array_remove(linked_providers, _provider)
  WHERE user_id = _user_id;
  
  -- If removing the primary auth provider, set the first available one as primary
  UPDATE public.profiles 
  SET auth_provider = linked_providers[1]
  WHERE user_id = _user_id 
  AND auth_provider = _provider
  AND array_length(linked_providers, 1) > 0;
END;
$$;