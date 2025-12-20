-- Create user_credentials table for WebAuthn/Passkeys biometric authentication
CREATE TABLE public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('fingerprint', 'face', 'pin', 'unknown')),
  transports TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create push_subscriptions table for web push notifications
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_user_credentials_user ON public.user_credentials(user_id);
CREATE INDEX idx_user_credentials_credential ON public.user_credentials(credential_id);
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_company ON public.push_subscriptions(company_id);
CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- Enable RLS
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credentials
CREATE POLICY "Users can view their own credentials"
  ON public.user_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
  ON public.user_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
  ON public.user_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
  ON public.user_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service role full access for push notifications sending
CREATE POLICY "Service role can read push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (true);