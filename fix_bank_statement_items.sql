-- Fix for Bank Statement Items
-- The table was missing the company_id column which is required for Row Level Security and the application logic.

ALTER TABLE bank_statement_items 
ADD COLUMN IF NOT EXISTS company_id uuid references companies(id);

-- Update RLS to be specific to company
DROP POLICY IF EXISTS "Public access" ON bank_statement_items;
CREATE POLICY "Users can view their own company statement items" 
ON bank_statement_items FOR ALL 
USING (company_id = (select id from companies where owner_id = auth.uid()));

-- Also ensure reconciliations has correct RLS
DROP POLICY IF EXISTS "Public access" ON reconciliations;
CREATE POLICY "Users can view their own company reconciliations" 
ON reconciliations FOR ALL 
USING (company_id = (select id from companies where owner_id = auth.uid()));
