
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
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Backfill existing users (and approve them by default to avoid lockout)
insert into public.profiles (id, email, full_name, is_approved)
select id, email, raw_user_meta_data->>'full_name', true 
from auth.users
on conflict (id) do nothing;

-- 6. Helper to make YOURSELF admin (Replace with your email)
-- update public.profiles set role = 'admin' where email = 'seu_email_aqui@exemplo.com';
