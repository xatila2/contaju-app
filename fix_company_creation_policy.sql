-- ==============================================================================
-- FIX: COMPANY CREATION POLICY
-- Description: Unlocks the ability for users to create their first company.
-- Previously, RLS checked "Are you the owner?" on INSERT, which is valid, 
-- but we need to ensure the policy explicitly allows the "creation" action.
-- ==============================================================================

-- 1. Ensure Table Permissions
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Create INSERT Policy
-- This says: "You can insert a row IF you lists yourself as the owner."
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;

CREATE POLICY "Users can create companies" ON public.companies
  FOR INSERT
  WITH CHECK ( auth.uid() = owner_id );

-- 3. (Optional) Ensure Select/Update/Delete works for Owner
-- (Re-affirming this just in case)
DROP POLICY IF EXISTS "Company Owner Access" ON public.companies;
CREATE POLICY "Company Owner Access" ON public.companies
  FOR ALL
  USING ( owner_id = auth.uid() )
  WITH CHECK ( owner_id = auth.uid() );

-- 4. Grant Permissions (just to be safe)
GRANT ALL ON public.companies TO authenticated;
