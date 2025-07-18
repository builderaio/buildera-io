-- Create table for company strategy
CREATE TABLE public.company_strategy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mision TEXT,
  vision TEXT,
  propuesta_valor TEXT,
  generated_with_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_strategy ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own strategy" 
ON public.company_strategy 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own strategy" 
ON public.company_strategy 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategy" 
ON public.company_strategy 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategy" 
ON public.company_strategy 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_company_strategy_updated_at
BEFORE UPDATE ON public.company_strategy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add country field to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT;