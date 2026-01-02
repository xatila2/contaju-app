-- =============================================================================
-- OPTIMIZE RLS POLICIES WITH RPC (Fix "Empty Data" / Recursion)
-- =============================================================================

-- 1. Ensure the RPC exists and returns SET OF uuid (for potentially multiple companies in future)
--    or just handle the single one we created.
--    The previous function `get_my_company_id` returns a SINGLE UUID.
--    Let's make a more robust one for policies: `get_my_company_ids()`

CREATE OR REPLACE FUNCTION get_my_company_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return owned companies
  RETURN QUERY SELECT id FROM companies WHERE owner_id = auth.uid();
  
  -- Return member companies
  RETURN QUERY SELECT company_id FROM company_members WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_company_ids() TO authenticated, service_role;

-- 2. Refactor 'companies' Policy to use this RPC
--    This breaks the recursion because the policy no longer queries 'companies' directly via self-referential joins,
--    but calls a SECURITY DEFINER function that bypasses RLS for the lookup.

DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Users can insert their own company" ON companies;
DROP POLICY IF EXISTS "Enable read access for owners and members" ON companies;

CREATE POLICY "Enable read access for owners and members" ON companies
FOR SELECT USING (
  id IN (SELECT get_my_company_ids())
);

CREATE POLICY "Enable update access for owners and members" ON companies
FOR UPDATE USING (
  id IN (SELECT get_my_company_ids())
);

CREATE POLICY "Enable insert access for authenticated users" ON companies
FOR INSERT WITH CHECK (
  auth.uid() = owner_id
);


-- 3. Refactor 'categories' Policy
--    Drop OLD names if they exist
DROP POLICY IF EXISTS "Users can view categories of their company" ON categories;
DROP POLICY IF EXISTS "Users can manage categories of their company" ON categories;

--    Drop NEW names if they exist (to fix "already exists" error)
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can manage categories" ON categories;

CREATE POLICY "Users can view categories" ON categories
FOR SELECT USING (
  company_id IN (SELECT get_my_company_ids())
);

CREATE POLICY "Users can manage categories" ON categories
FOR ALL USING (
  company_id IN (SELECT get_my_company_ids())
);

-- 4. Do the same for Transactions and other high-volume tables to ensuring speed.

DROP POLICY IF EXISTS "Users can view transactions of their company" ON transactions;
DROP POLICY IF EXISTS "Users can manage transactions of their company" ON transactions;

-- Drop NEW names too
DROP POLICY IF EXISTS "Users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage transactions" ON transactions;

CREATE POLICY "Users can view transactions" ON transactions
FOR SELECT USING (
  company_id IN (SELECT get_my_company_ids())
);

CREATE POLICY "Users can manage transactions" ON transactions
FOR ALL USING (
  company_id IN (SELECT get_my_company_ids())
);
