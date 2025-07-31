-- Fix infinite recursion in company_members policies by first dropping all existing policies

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their company members" ON public.company_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can manage members" ON public.company_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.company_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.company_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can add members" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can remove members" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can update memberships" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can view all members" ON public.company_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.company_members;

-- Create simple, non-recursive policies for basic functionality
CREATE POLICY "Users can view own company memberships" 
ON public.company_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Allow insert own membership" 
ON public.company_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update own membership" 
ON public.company_members 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Allow delete own membership" 
ON public.company_members 
FOR DELETE 
USING (auth.uid() = user_id);