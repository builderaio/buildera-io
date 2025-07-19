-- Enable Row Level Security on ai_model_configurations table
ALTER TABLE public.ai_model_configurations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read AI model configurations
-- This is needed for edge functions and authenticated users to access model configs
CREATE POLICY "Allow authenticated users to read AI model configurations" 
ON public.ai_model_configurations 
FOR SELECT 
TO authenticated
USING (true);

-- Only allow service role to insert/update/delete configurations
-- This ensures only system processes can modify these settings
CREATE POLICY "Only service role can modify AI model configurations" 
ON public.ai_model_configurations 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);