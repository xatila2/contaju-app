-- =============================================================================
-- FIX COMPLETE ONBOARDING: DATA MODEL, RLS, AND PROVISIONING
-- =============================================================================

-- STEP 1: SCHEMA UPDATES & TEMPLATE PREPARATION
-- Ensure we have identifiers for system templates

DO $$ 
BEGIN
    -- Add is_system_default column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='is_system_default') THEN
        ALTER TABLE categories ADD COLUMN is_system_default BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cost_centers' AND column_name='is_system_default') THEN
        ALTER TABLE cost_centers ADD COLUMN is_system_default BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Ensure columns allow NULL for company_id strictly for TEMPLATES
    -- Note: Most RLS will block NULL company_id reads, which is fine, as we copy them.
END $$;


-- STEP 2: INJECTION OF SYSTEM TEMPLATES (Based on constants.ts)
-- We use a dedicated "Template Company" concept or NULL company_id. 
-- Let's use NULL company_id + is_system_default = true for pure templates.

-- 2.1 Clean up old potential templates to avoid duplicates (Idempotency)
-- 2.1 Clean up old potential templates to avoid duplicates (Idempotency)
-- FORCE DROP of ALL Safety Triggers linked to the immutable check function
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find all triggers that call the 'check_system_template_immutable' function
    FOR r IN (
        SELECT t.tgname, c.relname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE p.proname = 'check_system_template_immutable'
          AND c.relname IN ('categories', 'cost_centers') -- Safety filter
    ) LOOP
        RAISE NOTICE 'Dropping blocking trigger: % on table %', r.tgname, r.relname;
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I;', r.tgname, r.relname);
    END LOOP;
END $$;

-- Now it is safe to delete
DELETE FROM categories WHERE company_id IS NULL AND is_system_default = TRUE;
DELETE FROM cost_centers WHERE company_id IS NULL AND is_system_default = TRUE;

-- Re-enable triggers is done AFTER inserts in a later block, or we re-enable immediately if inserts are safe?
-- Actually, we should keep them disabled until after inserts.


-- 2.2 Insert Cost Center Templates
INSERT INTO cost_centers (name, code, company_id, is_system_default) VALUES
('Geral / Administrativo', 'CC-001', NULL, TRUE),
('Comercial / Vendas', 'CC-002', NULL, TRUE),
('Operações / Produção', 'CC-003', NULL, TRUE),
('TI e Tecnologia', 'CC-004', NULL, TRUE),
('Marketing', 'CC-005', NULL, TRUE);

-- 2.3 Insert Category Templates (Hierarchical)
-- We need to handle parent-child relationships. We'll use a temporary method or DO block.
DO $$
DECLARE
    -- Income Vendas
    cat_1 uuid; cat_2 uuid; cat_3 uuid; cat_4 uuid; cat_5 uuid; cat_6 uuid; cat_7 uuid;
BEGIN
    -- 1.0 Receitas
    INSERT INTO categories (name, code, type, company_id, is_system_default) VALUES ('Receitas Operacionais', '1.0', 'income', NULL, TRUE) RETURNING id INTO cat_1;
    INSERT INTO categories (name, code, type, parent_id, company_id, is_system_default) VALUES 
        ('Vendas de Produtos', '1.01', 'income', cat_1, NULL, TRUE),
        ('Prestação de Serviços', '1.02', 'income', cat_1, NULL, TRUE),
        ('Outras Receitas', '1.03', 'income', cat_1, NULL, TRUE);

    -- 2.0 Custos Variáveis
    INSERT INTO categories (name, code, type, company_id, is_system_default) VALUES ('Custos Variáveis', '2.0', 'expense', NULL, TRUE) RETURNING id INTO cat_2;
    INSERT INTO categories (name, code, type, parent_id, company_id, is_system_default) VALUES 
        ('CMV - Custo Mercadoria Vendida', '2.01', 'expense', cat_2, NULL, TRUE),
        ('Impostos sobre Vendas', '2.02', 'expense', cat_2, NULL, TRUE),
        ('Comissões', '2.03', 'expense', cat_2, NULL, TRUE);

    -- 3.0 Despesas com Pessoal
    INSERT INTO categories (name, code, type, company_id, is_system_default) VALUES ('Despesas com Pessoal', '3.0', 'expense', NULL, TRUE) RETURNING id INTO cat_3;
    INSERT INTO categories (name, code, type, parent_id, company_id, is_system_default) VALUES 
        ('Salários e Ordenados', '3.01', 'expense', cat_3, NULL, TRUE),
        ('Pro-labore', '3.02', 'expense', cat_3, NULL, TRUE),
        ('Encargos Sociais', '3.03', 'expense', cat_3, NULL, TRUE);

    -- 4.0 Despesas Administrativas
    INSERT INTO categories (name, code, type, company_id, is_system_default) VALUES ('Despesas Administrativas', '4.0', 'expense', NULL, TRUE) RETURNING id INTO cat_4;
    INSERT INTO categories (name, code, type, parent_id, company_id, is_system_default) VALUES 
        ('Aluguel e Condomínio', '4.01', 'expense', cat_4, NULL, TRUE),
        ('Energia, Água e Internet', '4.02', 'expense', cat_4, NULL, TRUE),
        ('Softwares e Licenças', '4.03', 'expense', cat_4, NULL, TRUE),
        ('Marketing e Publicidade', '4.04', 'expense', cat_4, NULL, TRUE);

    -- 5.0 Despesas Financeiras
    INSERT INTO categories (name, code, type, company_id, is_system_default) VALUES ('Despesas Financeiras', '5.0', 'expense', NULL, TRUE) RETURNING id INTO cat_5;
    INSERT INTO categories (name, code, type, parent_id, company_id, is_system_default) VALUES 
        ('Tarifas Bancárias', '5.01', 'expense', cat_5, NULL, TRUE),
        ('Juros Pagos', '5.02', 'expense', cat_5, NULL, TRUE);
        
    -- 6.0 Investimentos
    INSERT INTO categories (name, code, type, company_id, is_system_default) VALUES ('Investimentos (CAPEX)', '6.0', 'expense', NULL, TRUE) RETURNING id INTO cat_6;
    INSERT INTO categories (name, code, type, parent_id, company_id, is_system_default) VALUES 
        ('Aquisição de Máquinas', '6.01', 'expense', cat_6, NULL, TRUE),
        ('Compra de Imóveis', '6.02', 'expense', cat_6, NULL, TRUE);

    -- 7.0 Financiamentos
    INSERT INTO categories (name, code, type, company_id, is_system_default) VALUES ('Financiamentos', '7.0', 'income', NULL, TRUE) RETURNING id INTO cat_7;
    INSERT INTO categories (name, code, type, parent_id, company_id, is_system_default) VALUES 
        ('Empréstimos Bancários', '7.01', 'income', cat_7, NULL, TRUE),
        ('Pagamento de Empréstimos', '7.02', 'expense', cat_7, NULL, TRUE),
        ('Distribuição de Lucros', '7.03', 'expense', cat_7, NULL, TRUE);

    -- 2.4 Re-Create Safety Triggers (So they are active again)
    -- We assume the function check_system_template_immutable() exists. if not we create it.
    
    -- (Self-Healing Function Definition just in case)
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_system_template_immutable') THEN
       -- We can't create function inside DO block easily without dynamic SQL, but assuming it exists is safer if we just dropped triggers.
       -- If it threw P0001 before, it definitely exists.
       NULL; 
    END IF;
END $$;

-- Define/Re-define the Safety Function and Triggers outside the DO block to be sure
CREATE OR REPLACE FUNCTION check_system_template_immutable()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_system_default = TRUE THEN
        RAISE EXCEPTION 'Categorias do sistema são imutáveis.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_system_template_immutable ON categories;
CREATE TRIGGER check_system_template_immutable
BEFORE DELETE OR UPDATE ON categories
FOR EACH ROW
WHEN (OLD.is_system_default = TRUE)
EXECUTE FUNCTION check_system_template_immutable();

DROP TRIGGER IF EXISTS check_system_template_immutable ON cost_centers;
CREATE TRIGGER check_system_template_immutable
BEFORE DELETE OR UPDATE ON cost_centers
FOR EACH ROW
WHEN (OLD.is_system_default = TRUE)
EXECUTE FUNCTION check_system_template_immutable();


-- STEP 3: OPTIMIZED RLS (RPC Based)
-- This fixes the visibility issue (Recursive Policies)

CREATE OR REPLACE FUNCTION get_my_company_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Return owned companies
  RETURN QUERY SELECT id FROM companies WHERE owner_id = auth.uid();
  -- Return member companies
  RETURN QUERY SELECT company_id FROM company_members WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_company_ids() TO authenticated, service_role;

-- Apply RLS Policies
-- Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for owners and members" ON companies;
CREATE POLICY "Enable read access for owners and members" ON companies
FOR SELECT USING (id IN (SELECT get_my_company_ids()));

DROP POLICY IF EXISTS "Enable update access for owners and members" ON companies;
CREATE POLICY "Enable update access for owners and members" ON companies
FOR UPDATE USING (id IN (SELECT get_my_company_ids()));

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON companies;
CREATE POLICY "Enable insert access for authenticated users" ON companies
FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view categories" ON categories;
CREATE POLICY "Users can view categories" ON categories
FOR SELECT USING (company_id IN (SELECT get_my_company_ids()));

DROP POLICY IF EXISTS "Users can manage categories" ON categories;
CREATE POLICY "Users can manage categories" ON categories
FOR ALL USING (company_id IN (SELECT get_my_company_ids()));

-- Cost Centers
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view cost centers" ON cost_centers;
CREATE POLICY "Users can view cost centers" ON cost_centers
FOR SELECT USING (company_id IN (SELECT get_my_company_ids()));

DROP POLICY IF EXISTS "Users can manage cost centers" ON cost_centers;
CREATE POLICY "Users can manage cost centers" ON cost_centers
FOR ALL USING (company_id IN (SELECT get_my_company_ids()));


-- STEP 4: PROVISIONING LOGIC (The "Missing Link")

DROP FUNCTION IF EXISTS provision_company_defaults(uuid);

CREATE OR REPLACE FUNCTION provision_company_defaults(new_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    parent_map jsonb;
    cat_rec record;
    new_parent_id uuid;
BEGIN
    -- 1. Copy Cost Centers (Flat)
    INSERT INTO cost_centers (company_id, name, code, is_system_default)
    SELECT new_company_id, name, code, TRUE
    FROM cost_centers
    WHERE company_id IS NULL AND is_system_default = TRUE;

    -- 2. Copy Categories (Hierarchy Preservation)
    -- This is tricky. We need to map old Parent IDs to new Parent IDs.
    -- Strategy: First Insert Roots, then Children.
    
    -- 2.1 Insert Roots
    WITH inserted_roots AS (
        INSERT INTO categories (company_id, name, code, type, is_system_default, parent_id)
        SELECT new_company_id, name, code, type, TRUE, NULL
        FROM categories
        WHERE company_id IS NULL AND is_system_default = TRUE AND parent_id IS NULL
        RETURNING id, code -- We use CODE as the reliable link since names match
    )
    -- 2.2 Insert Children (using code matching for parents)
    INSERT INTO categories (company_id, name, code, type, is_system_default, parent_id)
    SELECT 
        new_company_id, 
        child.name, 
        child.code, 
        child.type, 
        TRUE, 
        root.id -- The NEW parent ID
    FROM categories child
    JOIN categories parent_template ON child.parent_id = parent_template.id
    JOIN inserted_roots root ON root.code = parent_template.code -- Match by code
    WHERE child.company_id IS NULL AND child.is_system_default = TRUE AND child.parent_id IS NOT NULL;

END;
$$;


-- STEP 5: AUTOMATION (Triggers)

CREATE OR REPLACE FUNCTION public.handle_new_company_provisioning()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Call the provisioning function for the new company
    PERFORM provision_company_defaults(NEW.id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_company_created_provision ON companies;
CREATE TRIGGER on_company_created_provision
AFTER INSERT ON companies
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_company_provisioning();

-- SECURITY HARDENING (Step 4 of Plan)
ALTER FUNCTION handle_new_user() SET search_path = public, pg_temp;

