-- ==========================================
-- FIX: HIERARCHICAL CHART OF ACCOUNTS
-- ==========================================
-- This script deletes existing categories for the target user (test_final_autopilot_01)
-- and re-seeds them with a proper Parent (Group) -> Child (Sub-account) structure.

-- 1. DISABLE SAFETY TRIGGER (To allow deletion of defaults)
ALTER TABLE public.categories DISABLE TRIGGER check_system_template_immutable;

DO $$
DECLARE
    target_user_email text := 'test_final_autopilot_01@example.com';
    target_company_id uuid;
    
    -- Category IDs
    cat_rec_op uuid;
    cat_out_rec uuid;
    cat_desp_adm uuid;
    cat_pessoal uuid;
    cat_mkt uuid;
    cat_impostos uuid;
    cat_custos uuid;
BEGIN
    -- 1. Get Company ID
    SELECT public.get_my_company_id() INTO target_company_id;
    
    -- Fallback lookup if RPC fails or run as admin
    IF target_company_id IS NULL THEN
        SELECT id INTO target_company_id
        FROM public.companies
        WHERE owner_id = (SELECT id FROM auth.users WHERE email = target_user_email LIMIT 1);
    END IF;

    IF target_company_id IS NULL THEN
        RAISE NOTICE 'Target company for % not found. Skipping.', target_user_email;
        RETURN;
    END IF;

    RAISE NOTICE 'Updating Chart of Accounts for Company: %', target_company_id;

    -- 2. Clear Existing Categories
    DELETE FROM public.categories WHERE company_id = target_company_id;

    -- 3. Insert Groups (Roots)
    
    -- RECEITAS (Income)
    INSERT INTO public.categories (company_id, name, type, is_system_default, code) 
    VALUES (target_company_id, 'Receitas Operacionais', 'income', true, '1.0') 
    RETURNING id INTO cat_rec_op;

    INSERT INTO public.categories (company_id, name, type, is_system_default, code) 
    VALUES (target_company_id, 'Outras Receitas', 'income', true, '2.0') 
    RETURNING id INTO cat_out_rec;

    -- DESPESAS (Expense)
    INSERT INTO public.categories (company_id, name, type, is_system_default, code) 
    VALUES (target_company_id, 'Despesas Administrativas', 'expense', true, '3.0') 
    RETURNING id INTO cat_desp_adm;

    INSERT INTO public.categories (company_id, name, type, is_system_default, code) 
    VALUES (target_company_id, 'Pessoal', 'expense', true, '4.0') 
    RETURNING id INTO cat_pessoal;

    INSERT INTO public.categories (company_id, name, type, is_system_default, code) 
    VALUES (target_company_id, 'Marketing e Vendas', 'expense', true, '5.0') 
    RETURNING id INTO cat_mkt;

    INSERT INTO public.categories (company_id, name, type, is_system_default, code) 
    VALUES (target_company_id, 'Impostos e Taxas', 'expense', true, '6.0') 
    RETURNING id INTO cat_impostos;

    INSERT INTO public.categories (company_id, name, type, is_system_default, code) 
    VALUES (target_company_id, 'Custos Operacionais', 'expense', true, '7.0') 
    RETURNING id INTO cat_custos;


    -- 4. Insert Children (Leafs)

    -- Group 1.0: Receitas Operacionais
    INSERT INTO public.categories (company_id, parent_id, name, type, is_system_default, code) VALUES
    (target_company_id, cat_rec_op, 'Vendas de Produtos', 'income', true, '1.1'),
    (target_company_id, cat_rec_op, 'Serviços Prestados', 'income', true, '1.2'),
    (target_company_id, cat_rec_op, 'Adiantamento de Clientes', 'income', true, '1.3');

    -- Group 2.0: Outras Receitas
    INSERT INTO public.categories (company_id, parent_id, name, type, is_system_default, code) VALUES
    (target_company_id, cat_out_rec, 'Juros Recebidos', 'income', true, '2.1'),
    (target_company_id, cat_out_rec, 'Rendimentos de Aplicações', 'income', true, '2.2'),
    (target_company_id, cat_out_rec, 'Outras Entradas', 'income', true, '2.3');

    -- Group 3.0: Despesas Administrativas
    INSERT INTO public.categories (company_id, parent_id, name, type, is_system_default, code) VALUES
    (target_company_id, cat_desp_adm, 'Aluguel', 'expense', true, '3.1'),
    (target_company_id, cat_desp_adm, 'Condomínio', 'expense', true, '3.2'),
    (target_company_id, cat_desp_adm, 'Água, Luz e Telefone', 'expense', true, '3.3'),
    (target_company_id, cat_desp_adm, 'Internet e Sistemas', 'expense', true, '3.4'),
    (target_company_id, cat_desp_adm, 'Material de Escritório', 'expense', true, '3.5'),
    (target_company_id, cat_desp_adm, 'Limpeza e Conservação', 'expense', true, '3.6'),
    (target_company_id, cat_desp_adm, 'Seguros', 'expense', true, '3.7');

    -- Group 4.0: Pessoal
    INSERT INTO public.categories (company_id, parent_id, name, type, is_system_default, code) VALUES
    (target_company_id, cat_pessoal, 'Salários', 'expense', true, '4.1'),
    (target_company_id, cat_pessoal, 'Pró-Labore', 'expense', true, '4.2'),
    (target_company_id, cat_pessoal, 'Vale Transporte/Alimentação', 'expense', true, '4.3'),
    (target_company_id, cat_pessoal, 'Encargos Sociais (INSS/FGTS)', 'expense', true, '4.4'),
    (target_company_id, cat_pessoal, 'Adiantamentos', 'expense', true, '4.5');

    -- Group 5.0: Marketing
    INSERT INTO public.categories (company_id, parent_id, name, type, is_system_default, code) VALUES
    (target_company_id, cat_mkt, 'Publicidade e Propaganda', 'expense', true, '5.1'),
    (target_company_id, cat_mkt, 'Comissões de Vendas', 'expense', true, '5.2'),
    (target_company_id, cat_mkt, 'Brindes e Eventos', 'expense', true, '5.3');

    -- Group 6.0: Impostos
    INSERT INTO public.categories (company_id, parent_id, name, type, is_system_default, code) VALUES
    (target_company_id, cat_impostos, 'Simples Nacional / DAS', 'expense', true, '6.1'),
    (target_company_id, cat_impostos, 'ICMS / ISS', 'expense', true, '6.2'),
    (target_company_id, cat_impostos, 'Taxas Bancárias', 'expense', true, '6.3');

    -- Group 7.0: Custos Operacionais
    INSERT INTO public.categories (company_id, parent_id, name, type, is_system_default, code) VALUES
    (target_company_id, cat_custos, 'Fornecedores', 'expense', true, '7.1'),
    (target_company_id, cat_custos, 'Matéria-Prima', 'expense', true, '7.2'),
    (target_company_id, cat_custos, 'Transporte e Fretes', 'expense', true, '7.3'),
    (target_company_id, cat_custos, 'Manutenção de Equipamentos', 'expense', true, '7.4');

END $$;

-- 2. RE-ENABLE SAFETY TRIGGER
ALTER TABLE public.categories ENABLE TRIGGER check_system_template_immutable;
