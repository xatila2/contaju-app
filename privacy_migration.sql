-- Enable RLS on all tables (re-enforcing)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

-- 1. Add owner_id to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- 2. Update existing company (if any) to belong to the current user (running the script) 
--    OR just leave it null and let RLS hide it? 
--    Better to be safe: CAUTION. This script implies the user running it claims ownership of existing orphaned companies?
--    Let's just default to current user for NOW if single tenant, but for safety, let's just add the column.
--    The application logic will create a NEW company if it can't find one for the user.
--    Ideally, we update owner_id = auth.uid() for the first row? No, can't easily do that in generic SQL without context.
--    We will assume NEW data will be correct.

-- 3. RLS Policies
-- COMPANIES: Users can only see companies they own
DROP POLICY IF EXISTS "Public access" ON companies;
CREATE POLICY "Users can manage own companies" ON companies
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- BANK ACCOUNTS: Users can only see bank accounts of companies they own
DROP POLICY IF EXISTS "Public access" ON bank_accounts;
CREATE POLICY "Users can manage own bank accounts" ON bank_accounts
    USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- TRANSACTIONS
DROP POLICY IF EXISTS "Public access" ON transactions;
CREATE POLICY "Users can manage own transactions" ON transactions
    USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- CATEGORIES
DROP POLICY IF EXISTS "Public access" ON categories;
CREATE POLICY "Users can manage own categories" ON categories
    USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- COST CENTERS
DROP POLICY IF EXISTS "Public access" ON cost_centers;
CREATE POLICY "Users can manage own cost centers" ON cost_centers
    USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- CREDIT CARDS
DROP POLICY IF EXISTS "Public access" ON credit_cards;
CREATE POLICY "Users can manage own credit cards" ON credit_cards
    USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- CREDIT CARD TRANSACTIONS
DROP POLICY IF EXISTS "Public access" ON credit_card_transactions;
CREATE POLICY "Users can manage own cc transactions" ON credit_card_transactions
    USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- CREDIT CARD INVOICES
DROP POLICY IF EXISTS "Public access" ON credit_card_invoices;
CREATE POLICY "Users can manage own cc invoices" ON credit_card_invoices
    USING (credit_card_id IN (
        SELECT id FROM credit_cards WHERE company_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    ))
    WITH CHECK (credit_card_id IN (
        SELECT id FROM credit_cards WHERE company_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    ));

-- BUDGETS
DROP POLICY IF EXISTS "Public access" ON budgets;
CREATE POLICY "Users can manage own budgets" ON budgets
    USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- PURCHASES
DROP POLICY IF EXISTS "Public access" ON purchases;
CREATE POLICY "Users can manage own purchases" ON purchases
    USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- SIMULATIONS
DROP POLICY IF EXISTS "Public access" ON simulations;
CREATE POLICY "Users can manage own simulations" ON simulations
    USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));
