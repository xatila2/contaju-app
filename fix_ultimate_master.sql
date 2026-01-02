-- ==========================================
-- MASTER FIX: ONBOARDING, RLS, & PROVISIONING
-- ==========================================
-- Run this script in the Supabase SQL Editor.
-- It is IDEMPOTENT (safe to run multiple times).

BEGIN;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTION: Get My Company ID (Critical for Frontend discovery)
DROP FUNCTION IF EXISTS public.get_my_company_id();

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Try to find as Owner first
  SELECT id FROM public.companies
  WHERE owner_id = auth.uid()
  UNION
  -- Try to find as Member
  SELECT company_id FROM public.company_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- CRITICAL: Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO service_role;

-- 3. PROVISIONING FUNCTION (Creates Defaults)
DROP FUNCTION IF EXISTS public.provision_company_defaults(company_uuid uuid); -- Drop new signature
DROP FUNCTION IF EXISTS public.provision_company_defaults(company_id uuid);   -- Drop potential old signature
DROP FUNCTION IF EXISTS public.provision_company_defaults(uuid);             -- Generic drop to be safe

CREATE OR REPLACE FUNCTION public.provision_company_defaults(company_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- CATEGORIES (27 Defaults)
    -- Insert only if not exists to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE company_id = company_uuid) THEN
        INSERT INTO public.categories (company_id, name, type, is_system_default) VALUES
        (company_uuid, 'Receitas', 'income', true),
        (company_uuid, 'Despesas', 'expense', true),
        (company_uuid, 'Vendas de Produtos', 'income', true),
        (company_uuid, 'Serviços Prestados', 'income', true),
        (company_uuid, 'Outras Receitas', 'income', true),
        (company_uuid, 'Custos Operacionais', 'expense', true),
        (company_uuid, 'Despesas Administrativas', 'expense', true),
        (company_uuid, 'Pessoal', 'expense', true),
        (company_uuid, 'Impostos e Taxas', 'expense', true),
        (company_uuid, 'Marketing', 'expense', true),
        (company_uuid, 'Transporte', 'expense', true),
        (company_uuid, 'Aluguel', 'expense', true),
        (company_uuid, 'Água, Luz e Telefone', 'expense', true),
        (company_uuid, 'Internet', 'expense', true),
        (company_uuid, 'Manutenção', 'expense', true),
        (company_uuid, 'Material de Escritório', 'expense', true),
        (company_uuid, 'Serviços de Terceiros', 'expense', true),
        (company_uuid, 'Seguros', 'expense', true),
        (company_uuid, 'Despesas Financeiras', 'expense', true),
        (company_uuid, 'Investimentos', 'expense', true),
        (company_uuid, 'Outras Despesas', 'expense', true),
        (company_uuid, 'Retirada de Sócios', 'expense', true),
        (company_uuid, 'Empréstimos', 'expense', true),
        (company_uuid, 'Fornecedores', 'expense', true),
        (company_uuid, 'Adiantamento de Clientes', 'income', true),
        (company_uuid, 'Devolução de Vendas', 'expense', true),
        (company_uuid, 'Juros Recebidos', 'income', true);
    END IF;

    -- COST CENTERS (2 Defaults)
    IF NOT EXISTS (SELECT 1 FROM public.cost_centers WHERE company_id = company_uuid) THEN
        INSERT INTO public.cost_centers (company_id, name, code) VALUES
        (company_uuid, 'Geral', '001'),
        (company_uuid, 'Vendas', '002');
    END IF;
END;
$$;

-- 4. TRIGGER: ON COMPANY CREATED -> PROVISION
CREATE OR REPLACE FUNCTION public.on_company_created_provision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.provision_company_defaults(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_company_created_provision ON public.companies;
CREATE TRIGGER trigger_on_company_created_provision
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.on_company_created_provision();

-- 5. TRIGGER: NEW USER -> CREATE COMPANY
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Check if company already exists for this user (Idempotency)
  SELECT id INTO new_company_id FROM public.companies WHERE owner_id = NEW.id LIMIT 1;

  IF new_company_id IS NULL THEN
      -- Create Company
      INSERT INTO public.companies (name, owner_id)
      VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'), NEW.id)
      RETURNING id INTO new_company_id;
  END IF;

  -- Ensure Member Link
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (new_company_id, NEW.id, 'owner')
  ON CONFLICT DO NOTHING;

  -- Create Profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'owner'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$;

-- Recreate Auth Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS HELPER (SECURITY DEFINER) - BREAKS RECURSION
-- This function runs as superuser/owner, bypassing RLS to check permissions safely.
CREATE OR REPLACE FUNCTION public.has_company_access(requested_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = requested_company_id 
    AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.company_members 
    WHERE company_id = requested_company_id 
    AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_company_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_access(uuid) TO service_role;

-- 7. RLS POLICIES (Simple & Definitive)
-- Drop ALL potential legacy policy names to preventing Zombie Recursion
DROP POLICY IF EXISTS "Users can view their companies" ON public.companies;
DROP POLICY IF EXISTS "Users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their companies" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for own company" ON public.companies;
DROP POLICY IF EXISTS "Enable insert for own company" ON public.companies;
DROP POLICY IF EXISTS "Enable update for own company" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for users companies" ON public.companies;

DROP POLICY IF EXISTS "Users can view categories of their company" ON public.categories;
DROP POLICY IF EXISTS "Users can create categories for their company" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories of their company" ON public.categories;
DROP POLICY IF EXISTS "Users can delete categories of their company" ON public.categories;
DROP POLICY IF EXISTS "Enable read access for company categories" ON public.categories;
DROP POLICY IF EXISTS "Enable insert for company categories" ON public.categories;
DROP POLICY IF EXISTS "Enable update for company categories" ON public.categories;
DROP POLICY IF EXISTS "Enable delete for company categories" ON public.categories;

DROP POLICY IF EXISTS "Users can view members of their company" ON public.company_members;
DROP POLICY IF EXISTS "Enable read access for company members" ON public.company_members;

-- Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their companies"
ON public.companies FOR SELECT
USING (
  owner_id = auth.uid() OR
  public.has_company_access(id) 
);

CREATE POLICY "Users can insert companies"
ON public.companies FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their companies"
ON public.companies FOR UPDATE
USING (
  owner_id = auth.uid() OR 
  public.has_company_access(id)
);

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories of their company"
ON public.categories FOR SELECT
USING (
  public.has_company_access(company_id)
);

CREATE POLICY "Users can create categories for their company"
ON public.categories FOR INSERT
WITH CHECK (
  public.has_company_access(company_id)
);

CREATE POLICY "Users can update categories of their company"
ON public.categories FOR UPDATE
USING (
  public.has_company_access(company_id)
);

CREATE POLICY "Users can delete categories of their company"
ON public.categories FOR DELETE
USING (
  public.has_company_access(company_id)
);

-- Company Members
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their company"
ON public.company_members FOR SELECT
USING (
    user_id = auth.uid() OR
    public.has_company_access(company_id)
);

COMMIT;
