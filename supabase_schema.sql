-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- COMPANIES
create table companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  document text,
  branch_name text,
  capital_giro_necessario numeric default 0,
  notification_settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BANK ACCOUNTS
create table bank_accounts (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id),
  name text not null,
  type text, -- 'checking', 'investment', etc.
  opening_balance numeric default 0,
  initial_balance_date date,
  color text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CATEGORIES
create table categories (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id),
  name text not null,
  type text not null, -- 'income', 'expense'
  code text, -- for ordering e.g. '1.01'
  parent_id uuid references categories(id),
  is_system_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COST CENTERS
create table cost_centers (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id),
  name text not null,
  code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRANSACTIONS
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id),
  bank_account_id uuid references bank_accounts(id),
  category_id uuid references categories(id),
  cost_center_id uuid references cost_centers(id),
  type text not null, -- 'income', 'expense', 'transfer'
  description text not null,
  amount numeric not null,
  transaction_date date not null, -- launchDate
  due_date date, -- Vencimento
  payment_date date, -- Pagamento (Realizado)
  competence_month text, -- YYYY-MM
  status text default 'pending', -- 'pending', 'reconciled', 'overdue'
  client text,
  notes text,
  attachment_name text,
  is_reconciled boolean default false,
  
  -- Transfer specifics
  destination_bank_account_id uuid references bank_accounts(id),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BUDGETS (Planning)
create table budgets (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id),
  category_id uuid references categories(id),
  period text not null, -- YYYY-MM
  planned_amount numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PURCHASES (Compras/Parcelamentos)
create table purchases (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id),
  supplier_name text not null,
  description text,
  total_amount numeric not null,
  purchase_date date, 
  status text default 'draft',
  category_id uuid references categories(id),
  invoice_number text,
  installments_count integer default 1,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CREDIT CARDS
create table credit_cards (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id),
  name text not null,
  limit_amount numeric default 0,
  closing_day integer not null,
  due_day integer not null,
  default_bank_account_id uuid references bank_accounts(id),
  brand text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CREDIT CARD INVOICES
create table credit_card_invoices (
  id uuid default uuid_generate_v4() primary key,
  credit_card_id uuid references credit_cards(id),
  reference_month text not null, -- YYYY-MM
  closing_date date,
  due_date date,
  total_amount numeric default 0,
  status text default 'open', -- 'open', 'closed', 'paid'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CREDIT CARD TRANSACTIONS
create table credit_card_transactions (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id),
  credit_card_id uuid references credit_cards(id),
  invoice_id uuid references credit_card_invoices(id),
  category_id uuid references categories(id),
  cost_center_id uuid references cost_centers(id),
  description text not null,
  amount numeric not null,
  transaction_date date not null,
  installments_current integer default 1,
  installments_total integer default 1,
  client text,
  notes text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SIMULATIONS
create table simulations (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id),
  name text not null,
  config_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Optional but recommended - simplifying to Public for Anon Start)
alter table companies enable row level security;
create policy "Public access" on companies for all using (true);
alter table bank_accounts enable row level security;
create policy "Public access" on bank_accounts for all using (true);
alter table categories enable row level security;
create policy "Public access" on categories for all using (true);
alter table cost_centers enable row level security;
create policy "Public access" on cost_centers for all using (true);
alter table transactions enable row level security;
create policy "Public access" on transactions for all using (true);
alter table budgets enable row level security;
create policy "Public access" on budgets for all using (true);
alter table purchases enable row level security;
create policy "Public access" on purchases for all using (true);
alter table credit_cards enable row level security;
create policy "Public access" on credit_cards for all using (true);
alter table credit_card_invoices enable row level security;
create policy "Public access" on credit_card_invoices for all using (true);
alter table credit_card_transactions enable row level security;
create policy "Public access" on credit_card_transactions for all using (true);
alter table simulations enable row level security;
create policy "Public access" on simulations for all using (true);
