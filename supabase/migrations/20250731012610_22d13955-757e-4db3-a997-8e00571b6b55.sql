-- Fix infinite recursion in company_members policies

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their company members" ON public.company_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can manage members" ON public.company_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.company_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.company_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON public.company_members;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view their own memberships" 
ON public.company_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own membership" 
ON public.company_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" 
ON public.company_members 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own membership" 
ON public.company_members 
FOR DELETE 
USING (auth.uid() = user_id);