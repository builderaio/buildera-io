-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create table to store AI model monitoring logs
CREATE TABLE public.ai_model_status_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'degraded', 'maintenance')),
  response_time INTEGER NOT NULL DEFAULT 0,
  uptime NUMERIC(5,2) NOT NULL DEFAULT 0,
  error_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_model_status_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin to view AI model logs" 
ON public.ai_model_status_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Only service role can insert AI model logs" 
ON public.ai_model_status_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_ai_model_status_logs_provider_model ON public.ai_model_status_logs(provider, name);
CREATE INDEX idx_ai_model_status_logs_last_checked ON public.ai_model_status_logs(last_checked DESC);

-- Create cron job to run AI monitoring every 15 minutes
SELECT cron.schedule(
  'ai-model-monitoring-job',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://ubhzzppmkhxbuiajfswa.supabase.co/functions/v1/ai-model-monitoring',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaHp6cHBta2h4YnVpYWpmc3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU4MjIsImV4cCI6MjA2NzM0MTgyMn0.zWscWKJSXVFREwlkkBC0gwMNHcUlFCpakf-RZWBZ2bQ"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);