-- Create category_goals table
create table if not exists category_goals (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  year integer not null,
  month integer not null,
  goal_amount numeric(15,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicates per category/month
  unique(company_id, category_id, year, month)
);

-- Enable RLS
alter table category_goals enable row level security;

-- Policies
create policy "Users can view category goals for their company"
  on category_goals for select
  using (company_id in (select id from companies where owner_id = auth.uid()));

create policy "Users can insert category goals for their company"
  on category_goals for insert
  with check (company_id in (select id from companies where owner_id = auth.uid()));

create policy "Users can update category goals for their company"
  on category_goals for update
  using (company_id in (select id from companies where owner_id = auth.uid()));

create policy "Users can delete category goals for their company"
  on category_goals for delete
  using (company_id in (select id from companies where owner_id = auth.uid()));
