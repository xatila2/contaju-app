-- FIX PROFILE RLS POLICY (Prevent Recursion)
-- The 'profiles' table is critical for AuthContext.
-- If its policy depends on other tables (like 'companies' or 'company_members'), it can create a loop.
-- We will enforce a STRICT 'auth.uid() = id' policy which is 100% safe.

-- 1. Ensure Table Exists (Idempotent)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text default 'user',
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Reset RLS
alter table public.profiles enable row level security;

-- Drop generic policies
drop policy if exists "Public access" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

-- 3. Create SAFE Policy (Select)
create policy "Users can view own profile" on public.profiles
  for select using (
    auth.uid() = id
  );

-- 4. Create SAFE Policy (Update)
create policy "Users can update own profile" on public.profiles
  for update using (
    auth.uid() = id
  );

-- 5. Create SAFE Policy (Insert - usually handled by trigger, but for safety)
create policy "Users can insert own profile" on public.profiles
  for insert with check (
    auth.uid() = id
  );

-- 6. Grant Access
grant select, update, insert on public.profiles to authenticated;

-- 7. Ensure Owner Index Exists (Speed)
create index if not exists profiles_id_idx on public.profiles(id);
