-- --- RECONCILIATION OVERHAUL SCHEMA ---

-- 1. Table for Bank Statement Lines (Imported)
create table if not exists bank_statement_items (
  id uuid default uuid_generate_v4() primary key,
  bank_account_id uuid references bank_accounts(id) not null,
  date date not null,
  description text not null,
  amount numeric not null,
  fitid text, -- Financial Institution Transaction ID (unique identifier from OFX)
  memo text,
  is_reconciled boolean default false,
  reconciliation_id uuid, -- Will link to the reconciliation group when matched
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint to prevent duplicate imports of the same transaction
  unique(bank_account_id, fitid)
);

-- 2. Table for Reconciliation Groups (Events)
-- Represents the act of matching 1 Statement Item <-> N Internal Transactions
create table if not exists reconciliations (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) not null,
  bank_account_id uuid references bank_accounts(id) not null,
  date date default now(),
  status text default 'completed', -- 'completed'
  total_amount numeric not null,   -- Amount reconciled
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Link Table (The Match)
-- Links a Reconciliation Group to Internal Transactions
create table if not exists reconciliation_links (
  id uuid default uuid_generate_v4() primary key,
  reconciliation_id uuid references reconciliations(id) not null,
  bank_statement_item_id uuid references bank_statement_items(id), -- The source statement line
  transaction_id uuid references transactions(id) not null, -- The internal transaction matched
  amount_allocated numeric, -- Usually full amount, but allows partial mapping if needed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add support for RLS
alter table bank_statement_items enable row level security;
create policy "Public access" on bank_statement_items for all using (true);

alter table reconciliations enable row level security;
create policy "Public access" on reconciliations for all using (true);

alter table reconciliation_links enable row level security;
create policy "Public access" on reconciliation_links for all using (true);

-- Indexes for performance
create index if not exists idx_bsi_bank_account on bank_statement_items(bank_account_id);
create index if not exists idx_bsi_date on bank_statement_items(date);
create index if not exists idx_reconciliations_bank on reconciliations(bank_account_id);
