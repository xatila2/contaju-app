-- ==============================================================================
-- FIX: FINAL RLS STRUCTURE (The "Gold Standard")
-- Description: Replaces complex/fragile RLS policies with a robust SECURITY DEFINER function.
-- This bypasses recursion issues and guarantees consistent access control.
-- ==============================================================================

-- 1. Create Helper Function (SECURITY DEFINER = Runs as Admin/Owner)
-- This function checks if the current user has access to a company (Owner OR Member)
-- without being blocked by RLS policies on the 'companies' or 'company_members' tables.
CREATE OR REPLACE FUNCTION public.check_company_access(target_company_id uuid)
RETURNS boolean AS $$
BEGIN
  -- 1. Check if Owner (Direct check on companies table)
  IF EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = target_company_id 
    AND owner_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  -- 2. Check if Member (Direct check on company_members table)
  IF EXISTS (
    SELECT 1 FROM public.company_members 
    WHERE company_id = target_company_id 
    AND user_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. DATA TABLES: Apply the new function to Policies
-- We apply this to ALL tables that belong to a company.

-- ------------------------------------------------------------------------------
-- Table: categories
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;

CREATE POLICY "Users can manage categories" ON public.categories
  FOR ALL
  USING ( check_company_access(company_id) )
  WITH CHECK ( check_company_access(company_id) );

-- ------------------------------------------------------------------------------
-- Table: transactions
-- ------------------------------------------------------------------------------
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage transactions" ON public.transactions;

CREATE POLICY "Users can manage transactions" ON public.transactions
  FOR ALL
  USING ( check_company_access(company_id) )
  WITH CHECK ( check_company_access(company_id) );

-- ------------------------------------------------------------------------------
-- Table: bank_accounts
-- ------------------------------------------------------------------------------
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage bank_accounts" ON public.bank_accounts;

CREATE POLICY "Users can manage bank_accounts" ON public.bank_accounts
  FOR ALL
  USING ( check_company_access(company_id) )
  WITH CHECK ( check_company_access(company_id) );

-- ------------------------------------------------------------------------------
-- Table: cost_centers
-- ------------------------------------------------------------------------------
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage cost_centers" ON public.cost_centers;

CREATE POLICY "Users can manage cost_centers" ON public.cost_centers
  FOR ALL
  USING ( check_company_access(company_id) )
  WITH CHECK ( check_company_access(company_id) );

-- ------------------------------------------------------------------------------
-- Table: clients (customers)
-- ------------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage clients" ON public.clients;

CREATE POLICY "Users can manage clients" ON public.clients
  FOR ALL
  USING ( check_company_access(company_id) )
  WITH CHECK ( check_company_access(company_id) );


-- 3. CORE TABLES: Ensure 'companies' and 'company_members' are accessible
-- note: these do NOT use the function to avoid any weird logic loops, they use basic ID checks.

-- Companies: Owners can do everything, Members can View
DROP POLICY IF EXISTS "Company Access" ON public.companies;
CREATE POLICY "Company Owner Access" ON public.companies
  FOR ALL
  USING ( owner_id = auth.uid() )
  WITH CHECK ( owner_id = auth.uid() );

CREATE POLICY "Company Member View" ON public.companies
  FOR SELECT
  USING ( id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()) );

-- Company Members: Users can see memberships for themselves
DROP POLICY IF EXISTS "Member Access" ON public.company_members;
CREATE POLICY "Member Access" ON public.company_members
  FOR SELECT
  USING ( user_id = auth.uid() );

-- 4. Grant Execute
GRANT EXECUTE ON FUNCTION public.check_company_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_company_access TO anon;

