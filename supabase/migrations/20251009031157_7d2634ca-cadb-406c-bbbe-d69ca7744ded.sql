-- Asegurar que las edge functions (service role) puedan leer company_strategy
DROP POLICY IF EXISTS "Service role can read company_strategy" ON public.company_strategy;
CREATE POLICY "Service role can read company_strategy" 
ON public.company_strategy 
FOR SELECT 
USING (true);

-- Asegurar que las edge functions (service role) puedan leer company_branding
DROP POLICY IF EXISTS "Service role can read company_branding" ON public.company_branding;
CREATE POLICY "Service role can read company_branding" 
ON public.company_branding 
FOR SELECT 
USING (true);

-- Asegurar que las edge functions (service role) puedan leer company_objectives
DROP POLICY IF EXISTS "Service role can read company_objectives" ON public.company_objectives;
CREATE POLICY "Service role can read company_objectives" 
ON public.company_objectives 
FOR SELECT 
USING (true);

-- Asegurar que las edge functions puedan leer companies
DROP POLICY IF EXISTS "Service role can read companies" ON public.companies;
CREATE POLICY "Service role can read companies" 
ON public.companies 
FOR SELECT 
USING (true);

-- Asegurar que las edge functions puedan leer company_audiences
DROP POLICY IF EXISTS "Service role can read company_audiences" ON public.company_audiences;
CREATE POLICY "Service role can read company_audiences" 
ON public.company_audiences 
FOR SELECT 
USING (true);