
ALTER TABLE public.company_department_config 
ADD COLUMN IF NOT EXISTS daily_credit_limit integer NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS max_actions_per_day integer NOT NULL DEFAULT 10;
