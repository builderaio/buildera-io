-- Create table to store company data from external APIs
CREATE TABLE public.company_external_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_url TEXT,
  url_data JSONB,
  brand_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.company_external_data ENABLE ROW LEVEL SECURITY;

-- Create policies for company external data
CREATE POLICY "Users can view their own company data" 
ON public.company_external_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company data" 
ON public.company_external_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company data" 
ON public.company_external_data 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_company_external_data_updated_at
BEFORE UPDATE ON public.company_external_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();