-- --- MIGRAÇÃO DE AUTENTICAÇÃO E MULTI-TENANCY ---
-- INSTRUÇÕES:
-- 1. Copie todo o conteúdo deste arquivo.
-- 2. Cole no SQL Editor do Supabase e clique em RUN.

-- 1. Adicionar owner_id à tabela companies
alter table companies add column if not exists owner_id uuid references auth.users(id);

-- 2. Atualizar RLS para Companies (Acesso apenas ao Dono)
alter table companies enable row level security;

-- Remove policy antiga (pública) se existir
drop policy if exists "Public access" on companies;

-- Cria policy para SELECT (Ver apenas suas empresas)
create policy "Users can view own companies" on companies
  for select using (auth.uid() = owner_id);

-- Cria policy para INSERT (Criar empresa vinculada a si mesmo)
create policy "Users can insert own companies" on companies
  for insert with check (auth.uid() = owner_id);

-- Cria policy para UPDATE (Editar apenas suas empresas)
create policy "Users can update own companies" on companies
  for update using (auth.uid() = owner_id);

-- 3. Atualizar RLS para todas as outras tabelas (Vinculadas via company_id)
-- Tabela Categories
alter table categories enable row level security;
drop policy if exists "Public access" on categories;
create policy "Users can view own categories" on categories
  for all using (
    exists ( select 1 from companies where id = categories.company_id and owner_id = auth.uid() )
  );

-- Tabela Bank Accounts
alter table bank_accounts enable row level security;
drop policy if exists "Public access" on bank_accounts;
create policy "Users can view own bank_accounts" on bank_accounts
  for all using (
    exists ( select 1 from companies where id = bank_accounts.company_id and owner_id = auth.uid() )
  );

-- Tabela Cost Centers
alter table cost_centers enable row level security;
drop policy if exists "Public access" on cost_centers;
create policy "Users can view own cost_centers" on cost_centers
  for all using (
    exists ( select 1 from companies where id = cost_centers.company_id and owner_id = auth.uid() )
  );

-- Tabela Transactions
alter table transactions enable row level security;
drop policy if exists "Public access" on transactions;
create policy "Users can view own transactions" on transactions
  for all using (
    exists ( select 1 from companies where id = transactions.company_id and owner_id = auth.uid() )
  );

-- Tabela Budgets
alter table budgets enable row level security;
drop policy if exists "Public access" on budgets;
create policy "Users can view own budgets" on budgets
  for all using (
    exists ( select 1 from companies where id = budgets.company_id and owner_id = auth.uid() )
  );

-- Tabela Purchases
alter table purchases enable row level security;
drop policy if exists "Public access" on purchases;
create policy "Users can view own purchases" on purchases
  for all using (
    exists ( select 1 from companies where id = purchases.company_id and owner_id = auth.uid() )
  );

-- Tabela Credit Cards
alter table credit_cards enable row level security;
drop policy if exists "Public access" on credit_cards;
create policy "Users can view own credit_cards" on credit_cards
  for all using (
    exists ( select 1 from companies where id = credit_cards.company_id and owner_id = auth.uid() )
  );

-- Tabela Credit Card Invoices
alter table credit_card_invoices enable row level security;
drop policy if exists "Public access" on credit_card_invoices;
create policy "Users can view own credit_card_invoices" on credit_card_invoices
  for all using (
    exists ( select 1 from companies where id = credit_card_invoices.credit_card_id and owner_id = auth.uid() )
  ); -- Nota: Invoices linkam via credit_card_id -> credit_cards -> company_id -> owner_id. 
     -- Mas como credit_cards já é filtrado, e SQL policies sao diretas, melhor fazer join com credit_cards.
     -- SELECT 1 FROM credit_cards cc WHERE cc.id = credit_card_invoices.credit_card_id AND EXISTS (SELECT 1 FROM companies c WHERE c.id = cc.company_id AND c.owner_id = auth.uid())
     
drop policy if exists "Users can view own credit_card_invoices" on credit_card_invoices;
create policy "Users can view own credit_card_invoices" on credit_card_invoices
  for all using (
    exists (
      select 1 from credit_cards cc 
      join companies c on cc.company_id = c.id 
      where cc.id = credit_card_invoices.credit_card_id and c.owner_id = auth.uid()
    )
  );

-- Tabela Credit Card Transactions
alter table credit_card_transactions enable row level security;
drop policy if exists "Public access" on credit_card_transactions;
create policy "Users can view own credit_card_transactions" on credit_card_transactions
  for all using (
    exists ( select 1 from companies where id = credit_card_transactions.company_id and owner_id = auth.uid() )
  );

-- Tabela Simulations
alter table simulations enable row level security;
drop policy if exists "Public access" on simulations;
create policy "Users can view own simulations" on simulations
  for all using (
    exists ( select 1 from companies where id = simulations.company_id and owner_id = auth.uid() )
  );

-- Se aparecer "Success", suas tabelas agora estão protegidas por usuário!
