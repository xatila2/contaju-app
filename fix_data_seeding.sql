-- ==============================================================================
-- FIX: Data Seeding & Permissions (Categories, Cost Centers, etc.)
-- Description: Unlocks INSERT/UPDATE/DELETE for authenticated users on auxiliary tables.
-- ==============================================================================

-- 1. Categories
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

CREATE POLICY "Users can manage own categories" ON categories
    FOR ALL
    USING (auth.uid() IN (SELECT owner_id FROM companies WHERE id = categories.company_id))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM companies WHERE id = categories.company_id));

-- 2. Cost Centers
DROP POLICY IF EXISTS "Users can view own cost centers" ON cost_centers;
DROP POLICY IF EXISTS "Users can insert own cost centers" ON cost_centers;
DROP POLICY IF EXISTS "Users can update own cost centers" ON cost_centers;
DROP POLICY IF EXISTS "Users can delete own cost centers" ON cost_centers;

CREATE POLICY "Users can manage own cost centers" ON cost_centers
    FOR ALL
    USING (auth.uid() IN (SELECT owner_id FROM companies WHERE id = cost_centers.company_id))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM companies WHERE id = cost_centers.company_id));

-- 3. Category Rules
DROP POLICY IF EXISTS "Users can manage own category rules" ON category_rules;
CREATE POLICY "Users can manage own category rules" ON category_rules
    FOR ALL
    USING (auth.uid() IN (SELECT owner_id FROM companies WHERE id = category_rules.company_id))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM companies WHERE id = category_rules.company_id));

-- 4. Bank Accounts (Just in case)
DROP POLICY IF EXISTS "Users can manage own bank accounts" ON bank_accounts;
CREATE POLICY "Users can manage own bank accounts" ON bank_accounts
    FOR ALL
    USING (auth.uid() IN (SELECT owner_id FROM companies WHERE id = bank_accounts.company_id))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM companies WHERE id = bank_accounts.company_id));

-- 5. Credit Cards
DROP POLICY IF EXISTS "Users can manage own credit cards" ON credit_cards;
CREATE POLICY "Users can manage own credit cards" ON credit_cards
    FOR ALL
    USING (auth.uid() IN (SELECT owner_id FROM companies WHERE id = credit_cards.company_id))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM companies WHERE id = credit_cards.company_id));


-- DO NOT RUN REPAIR HERE. 
-- The frontend will automatically detect 0 categories and run `seedDefaultCategories` 
-- now that the policies allow it.
