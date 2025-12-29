-- =============================================================================
-- FIX RECURSIVE SELECT / "HANG" ON COMPANY LOADING
-- =============================================================================

-- Problem: The RLS policy on 'companies' table might be checking 'company_members',
-- which in turn checks 'companies', creating an infinite loop that hangs the request.

-- Solution: Create a 'SECURITY DEFINER' function that allows authenticated users
-- to get their Company ID without triggering the recursive RLS check on the table itself.

CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
SET search_path = public
AS $$
DECLARE
  comp_id uuid;
BEGIN
  -- 1. Check if user is the OWNER of a company
  SELECT id INTO comp_id 
  FROM companies 
  WHERE owner_id = auth.uid() 
  LIMIT 1;
  
  IF comp_id IS NOT NULL THEN
    RETURN comp_id;
  END IF;
  
  -- 2. Check if user is a MEMBER of a company
  SELECT company_id INTO comp_id 
  FROM company_members 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  RETURN comp_id;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_my_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_company_id() TO service_role;
GRANT EXECUTE ON FUNCTION get_my_company_id() TO anon; -- Just in case, though usually authenticated

-- Comment
COMMENT ON FUNCTION get_my_company_id IS 'Returns the company ID for the current user (Owner or Member) bypassing RLS recursion.';
