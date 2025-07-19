-- Create table for API keys management
CREATE TABLE public.llm_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google', 'groq', etc.
  model_name TEXT NOT NULL,
  api_key_name TEXT NOT NULL, -- Descriptive name for the key
  api_key_hash TEXT NOT NULL, -- Encrypted/hashed API key (last 4 chars visible)
  key_last_four TEXT NOT NULL, -- Last 4 characters for identification
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'expired'
  usage_limit_monthly NUMERIC, -- Monthly usage limit in tokens/requests
  cost_limit_monthly NUMERIC, -- Monthly cost limit in USD
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_usage_check TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create table for API usage tracking
CREATE TABLE public.llm_api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.llm_api_keys(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_tokens INTEGER DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(api_key_id, usage_date)
);

-- Create table for billing information
CREATE TABLE public.llm_api_billing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.llm_api_keys(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_usage_tokens INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.llm_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_api_billing ENABLE ROW LEVEL SECURITY;

-- Create policies for API keys (only admins can manage)
CREATE POLICY "Admins can manage API keys" ON public.llm_api_keys FOR ALL USING (true);
CREATE POLICY "Admins can view API usage" ON public.llm_api_usage FOR ALL USING (true);
CREATE POLICY "Admins can view billing info" ON public.llm_api_billing FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_llm_api_keys_provider ON public.llm_api_keys(provider);
CREATE INDEX idx_llm_api_keys_status ON public.llm_api_keys(status);
CREATE INDEX idx_llm_api_usage_api_key_date ON public.llm_api_usage(api_key_id, usage_date);
CREATE INDEX idx_llm_api_usage_provider ON public.llm_api_usage(provider);
CREATE INDEX idx_llm_api_billing_api_key ON public.llm_api_billing(api_key_id);
CREATE INDEX idx_llm_api_billing_period ON public.llm_api_billing(billing_period_start, billing_period_end);

-- Create trigger for updated_at
CREATE TRIGGER update_llm_api_keys_updated_at
  BEFORE UPDATE ON public.llm_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_llm_api_usage_updated_at
  BEFORE UPDATE ON public.llm_api_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_llm_api_billing_updated_at
  BEFORE UPDATE ON public.llm_api_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.llm_api_keys (provider, model_name, api_key_name, api_key_hash, key_last_four, status, usage_limit_monthly, cost_limit_monthly, notes) VALUES
('openai', 'gpt-4o', 'Producción Principal', 'sk-...hash...', '1a2b', 'active', 1000000, 500, 'API key principal para producción'),
('openai', 'gpt-4o-mini', 'Desarrollo', 'sk-...hash...', '3c4d', 'active', 500000, 100, 'API key para desarrollo y testing'),
('anthropic', 'claude-3-5-sonnet-20241022', 'Claude Principal', 'sk-ant-...hash...', '5e6f', 'active', 800000, 400, 'API key principal para Claude'),
('google', 'gemini-pro', 'Gemini Testing', 'AI...hash...', '7g8h', 'active', 600000, 200, 'API key para testing Gemini'),
('groq', 'llama-3.1-70b-versatile', 'Groq Fast', 'gsk_...hash...', '9i0j', 'active', 1000000, 150, 'API key para respuestas rápidas');

-- Insert sample usage data
INSERT INTO public.llm_api_usage (api_key_id, provider, model_name, usage_date, total_tokens, prompt_tokens, completion_tokens, total_requests, total_cost)
SELECT 
  id,
  provider,
  model_name,
  CURRENT_DATE - INTERVAL '1 day' * (random() * 30)::integer,
  (random() * 50000)::integer,
  (random() * 25000)::integer,
  (random() * 25000)::integer,
  (random() * 1000)::integer,
  (random() * 50)::numeric(10,2)
FROM public.llm_api_keys, generate_series(1, 5);

-- Insert sample billing data
INSERT INTO public.llm_api_billing (api_key_id, provider, billing_period_start, billing_period_end, total_usage_tokens, total_cost, status)
SELECT 
  id,
  provider,
  DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month',
  DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day',
  (random() * 500000)::integer,
  (random() * 300)::numeric(10,2),
  CASE WHEN random() > 0.8 THEN 'paid' ELSE 'pending' END
FROM public.llm_api_keys;