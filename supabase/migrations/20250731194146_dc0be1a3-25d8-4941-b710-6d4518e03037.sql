-- Create marketing_onboarding_status table to track onboarding completion
CREATE TABLE public.marketing_onboarding_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  onboarding_version VARCHAR(10) NOT NULL DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_onboarding_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own onboarding status" 
ON public.marketing_onboarding_status 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding status" 
ON public.marketing_onboarding_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding status" 
ON public.marketing_onboarding_status 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create unique constraint to ensure one record per user
CREATE UNIQUE INDEX idx_marketing_onboarding_user_id 
ON public.marketing_onboarding_status(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_marketing_onboarding_status_updated_at
    BEFORE UPDATE ON public.marketing_onboarding_status
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();