-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create usage tracking table
CREATE TABLE public.subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  usage_type TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_type, period_start)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Plans are viewable by everyone" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage plans" 
ON public.subscription_plans 
FOR ALL 
USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for subscription_usage
CREATE POLICY "Users can view their own usage" 
ON public.subscription_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage usage" 
ON public.subscription_usage 
FOR ALL 
USING (true);

-- Insert default plans
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, sort_order) VALUES
('Starter', 'starter', 'Para emprendedores que quieren probar el poder de la IA', 0, 0, 
 '["1 especialista de IA (Marketing básico)", "500 análisis de datos/mes", "Dashboard básico con métricas clave", "Generación de contenido básico (10 posts/mes)", "Análisis de competencia básico", "Soporte por chat"]'::jsonb,
 '{"specialists": 1, "data_analysis": 500, "content_generation": 10, "social_integrations": 0}'::jsonb, 1),

('Growth', 'growth', 'Para negocios listos para escalar', 89, 890, 
 '["Todo del plan Starter", "3 especialistas de IA (Marketing + Ventas + Atención al Cliente)", "5,000 análisis de datos/mes", "Automatización de procesos básica", "Integración con 2 redes sociales", "Generación de contenido avanzado (50 posts/mes)", "Análisis de competencia detallado", "Reportes semanales"]'::jsonb,
 '{"specialists": 3, "data_analysis": 5000, "content_generation": 50, "social_integrations": 2}'::jsonb, 2),

('Scale', 'scale', 'Para empresas que buscan dominar su mercado', 249, 2490, 
 '["Todo del plan Growth", "6 especialistas de IA (+ Jurídico + RRHH + Finanzas)", "20,000 análisis de datos/mes", "Automatización avanzada de workflows", "Integración con todas las redes sociales", "Generación de contenido ilimitado", "IA predictiva para ventas", "Análisis de mercado en tiempo real", "Soporte prioritario"]'::jsonb,
 '{"specialists": 6, "data_analysis": 20000, "content_generation": -1, "social_integrations": -1}'::jsonb, 3),

('Enterprise', 'enterprise', 'Para empresas que quieren liderar su industria', 499, 4990, 
 '["Todo del plan Scale", "Equipo completo de 8 especialistas de IA", "Análisis ilimitados", "Agentes personalizados", "Integraciones API personalizadas", "White-label disponible", "Account manager dedicado", "Implementación personalizada", "SLA garantizado"]'::jsonb,
 '{"specialists": 8, "data_analysis": -1, "content_generation": -1, "social_integrations": -1, "custom_agents": true, "white_label": true}'::jsonb, 4);

-- Create function to get user's current plan
CREATE OR REPLACE FUNCTION public.get_user_subscription(user_id_param UUID)
RETURNS TABLE(
  plan_name TEXT,
  plan_slug TEXT,
  limits JSONB,
  status TEXT,
  current_period_end TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.name,
    sp.slug,
    sp.limits,
    us.status,
    us.current_period_end
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_id_param
  AND us.status = 'active'
  LIMIT 1;
  
  -- If no subscription found, return default (Starter)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      sp.name,
      sp.slug,
      sp.limits,
      'active'::TEXT,
      NULL::TIMESTAMPTZ
    FROM public.subscription_plans sp
    WHERE sp.slug = 'starter'
    LIMIT 1;
  END IF;
END;
$$;

-- Create function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  user_id_param UUID,
  usage_type_param TEXT,
  limit_key_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan RECORD;
  current_usage INTEGER;
  plan_limit INTEGER;
BEGIN
  -- Get user's current plan
  SELECT * INTO user_plan FROM public.get_user_subscription(user_id_param);
  
  -- Get the limit for this usage type
  plan_limit := (user_plan.limits->limit_key_param)::INTEGER;
  
  -- If limit is -1, it means unlimited
  IF plan_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Get current month usage
  SELECT COALESCE(usage_count, 0) INTO current_usage
  FROM public.subscription_usage
  WHERE user_id = user_id_param 
    AND usage_type = usage_type_param
    AND period_start = date_trunc('month', now())
    AND period_end = date_trunc('month', now()) + interval '1 month';
  
  RETURN current_usage < plan_limit;
END;
$$;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(
  user_id_param UUID,
  usage_type_param TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  period_start TIMESTAMPTZ;
  period_end TIMESTAMPTZ;
BEGIN
  period_start := date_trunc('month', now());
  period_end := period_start + interval '1 month';
  
  INSERT INTO public.subscription_usage (user_id, usage_type, usage_count, period_start, period_end)
  VALUES (user_id_param, usage_type_param, increment_by, period_start, period_end)
  ON CONFLICT (user_id, usage_type, period_start)
  DO UPDATE SET 
    usage_count = subscription_usage.usage_count + increment_by,
    updated_at = now();
END;
$$;