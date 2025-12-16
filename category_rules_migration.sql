-- Create category_rules table
create table if not exists category_rules (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  type text check (type in ('income', 'expense')) not null,
  keyword text not null,
  category_id uuid references categories(id) on delete cascade not null,
  priority integer default 0,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table category_rules enable row level security;

-- Policies
create policy "Users can view category rules for their company"
  on category_rules for select
  using (company_id in (select id from companies where owner_id = auth.uid()));

create policy "Users can insert category rules for their company"
  on category_rules for insert
  with check (company_id in (select id from companies where owner_id = auth.uid()));

create policy "Users can update category rules for their company"
  on category_rules for update
  using (company_id in (select id from companies where owner_id = auth.uid()));

create policy "Users can delete category rules for their company"
  on category_rules for delete
  using (company_id in (select id from companies where owner_id = auth.uid()));
