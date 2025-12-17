-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  address TEXT,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view clients from their company" ON clients
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert clients for their company" ON clients
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clients from their company" ON clients
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete clients from their company" ON clients
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Add client_id to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Migration to link existing text-based clients?
-- Optional: We can write a script later if needed to migrate transaction.client string to client_id relations.
