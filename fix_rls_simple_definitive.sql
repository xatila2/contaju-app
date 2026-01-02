-- =============================================================================
-- FIX: SIMPLE DEFINITIVE RLS (Removing RPC Dependency)
-- =============================================================================

-- Diagnosis: Data exists (27 categories), but is hidden from the user.
-- Solution: Use direct SQL policies (Standard Supabase Pattern) to guarantee visibility.

-- 1. COMPANIES POLICY
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for owners and members" ON companies;
DROP POLICY IF EXISTS "Enable update access for owners and members" ON companies;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON companies;

-- Read: You can see if you are the owner OR a member
CREATE POLICY "RLS_Companies_Select" ON companies
FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = id AND cm.user_id = auth.uid())
);

-- Update: Owner only
CREATE POLICY "RLS_Companies_Update" ON companies
FOR UPDATE USING (owner_id = auth.uid());

-- Insert: Authenticated users can create companies
CREATE POLICY "RLS_Companies_Insert" ON companies
FOR INSERT WITH CHECK (auth.uid() = owner_id);


-- 2. CATEGORIES POLICY
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can manage categories" ON categories;

-- Select/All: Visible if you own the company OR are a member
CREATE POLICY "RLS_Categories_All" ON categories
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM companies c 
        WHERE c.id = categories.company_id 
        AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM company_members cm 
        WHERE cm.company_id = categories.company_id 
        AND cm.user_id = auth.uid()
    )
);


-- 3. COST CENTERS POLICY
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view cost centers" ON cost_centers;
DROP POLICY IF EXISTS "Users can manage cost centers" ON cost_centers;

CREATE POLICY "RLS_CostCenters_All" ON cost_centers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM companies c 
        WHERE c.id = cost_centers.company_id 
        AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM company_members cm 
        WHERE cm.company_id = cost_centers.company_id 
        AND cm.user_id = auth.uid()
    )
);

-- 4. MEMBERS POLICY (Ensure members can see themselves)
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
-- Standard policy implies members can see their own rows
DROP POLICY IF EXISTS "Members can view own rows" ON company_members;
CREATE POLICY "Members can view own rows" ON company_members
FOR SELECT USING (user_id = auth.uid());
