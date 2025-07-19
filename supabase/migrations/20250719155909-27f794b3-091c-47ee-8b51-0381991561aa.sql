-- Añadir campos específicos para empresas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nit TEXT,
ADD COLUMN IF NOT EXISTS business_objectives TEXT,
ADD COLUMN IF NOT EXISTS headquarters_address TEXT,
ADD COLUMN IF NOT EXISTS headquarters_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS headquarters_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS headquarters_city TEXT,
ADD COLUMN IF NOT EXISTS headquarters_country TEXT;

-- Crear tabla para objetivos empresariales detallados (opcional para objetivos múltiples)
CREATE TABLE IF NOT EXISTS public.company_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  objective_type TEXT NOT NULL, -- 'short_term', 'medium_term', 'long_term'
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  priority INTEGER DEFAULT 1, -- 1-5 scale
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for company_objectives
ALTER TABLE public.company_objectives ENABLE ROW LEVEL SECURITY;

-- Create policies for company_objectives
CREATE POLICY "Users can view their own company objectives" 
ON public.company_objectives 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own company objectives" 
ON public.company_objectives 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company objectives" 
ON public.company_objectives 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company objectives" 
ON public.company_objectives 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_company_objectives_updated_at
BEFORE UPDATE ON public.company_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();