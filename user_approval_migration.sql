-- MIGRATION: User Approval System
-- Cria tabela de perfis para gerenciar aprovações

-- 1. Create Profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  is_approved boolean default false,
  role text default 'user', -- 'admin', 'user'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. RLS Policies
-- Users can view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Users can update their own profile (optional, e.g. name)
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Admins can view all profiles (you will need to manually set your first admin in the DB)
-- For now, simplest approach: allow read so login check works easily, or use a secure function.
-- To keep it secure: Public read is okay for strictly 'is_approved' ?? No, better be private.
-- Let's stick to "Users can view own profile". The login logic will query *as* the logged-in user to check their *own* status.

-- 4. Trigger to create profile on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, is_approved)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    false -- Default to FALSE (Not Approved)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to ensure clean state
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Helper function for admin approval (Optional, makes manual admin easier)
-- Usage: select approve_user('user_email@example.com');
create or replace function approve_user(user_email text)
returns void as $$
begin
  update public.profiles
  set is_approved = true
  where email = user_email;
end;
$$ language plpgsql security definer;
