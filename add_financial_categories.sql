-- ATUALIZAÇÃO: RECEITAS E DESPESAS FINANCEIRAS
-- 1. Renomeia "Outras Receitas" para "Receitas Financeiras"
-- 2. Adiciona o grupo "8.0 Despesas Financeiras" e seus filhos

DO $$
DECLARE
    company_rec RECORD;
    new_root_id uuid;
    
    -- IDs para os templates globais (gerados agora para garantir a inserção)
    tmpl_fin_exp_id uuid := gen_random_uuid(); 
BEGIN
    -- =================================================================
    -- A. ATUALIZAR TEMPLATES GLOBAIS (Company IS NULL)
    -- =================================================================
    RAISE NOTICE 'Atualizando Templates Globais...';

    -- 1. Renomear 2.0
    UPDATE public.categories 
    SET name = 'Receitas Financeiras', cash_flow_type = 'financial'
    WHERE company_id IS NULL AND code = '2.0';

    -- Atualizar filhos do 2.0 para tipo 'financial' também? (Opcional, mas bom)
    UPDATE public.categories 
    SET cash_flow_type = 'financial'
    WHERE company_id IS NULL AND parent_id IN (SELECT id FROM public.categories WHERE company_id IS NULL AND code = '2.0');

    -- 2. Inserir 8.0 (Despesas Financeiras) se não existir
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE company_id IS NULL AND code = '8.0') THEN
        INSERT INTO public.categories (id, company_id, name, code, type, is_system_default, cash_flow_type, parent_id)
        VALUES (tmpl_fin_exp_id, NULL, 'Despesas Financeiras', '8.0', 'expense', true, 'financial', NULL);
        
        -- Filhos do 8.0
        INSERT INTO public.categories (company_id, parent_id, name, code, type, is_system_default, cash_flow_type) VALUES
        (NULL, tmpl_fin_exp_id, 'Juros Pagos', '8.1', 'expense', true, 'financial'),
        (NULL, tmpl_fin_exp_id, 'Multas e Juros', '8.2', 'expense', true, 'financial'),
        (NULL, tmpl_fin_exp_id, 'Tarifas Bancárias (Extra)', '8.3', 'expense', true, 'financial');
    ELSE
        RAISE NOTICE 'Template 8.0 já existe. Pulando inserção.';
    END IF;


    -- =================================================================
    -- B. ATUALIZAR TODAS AS EMPRESAS EXISTENTES
    -- =================================================================
    RAISE NOTICE 'Atualizando Empresas Existentes...';

    FOR company_rec IN SELECT id, name FROM public.companies
    LOOP
        RAISE NOTICE 'Processando empresa: %', company_rec.name;

        -- 1. Renomear 2.0 local
        UPDATE public.categories 
        SET name = 'Receitas Financeiras', cash_flow_type = 'financial'
        WHERE company_id = company_rec.id AND code = '2.0';

        -- Atualizar filhos do 2.0 local
        UPDATE public.categories 
        SET cash_flow_type = 'financial'
        WHERE company_id = company_rec.id AND parent_id IN (SELECT id FROM public.categories WHERE company_id = company_rec.id AND code = '2.0');

        -- 2. Inserir 8.0 local se não existir
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE company_id = company_rec.id AND code = '8.0') THEN
            
            -- Criar Pai (8.0)
            INSERT INTO public.categories (company_id, name, code, type, is_system_default, cash_flow_type, parent_id)
            VALUES (company_rec.id, 'Despesas Financeiras', '8.0', 'expense', true, 'financial', NULL)
            RETURNING id INTO new_root_id;

            -- Criar Filhos
            INSERT INTO public.categories (company_id, parent_id, name, code, type, is_system_default, cash_flow_type) VALUES
            (company_rec.id, new_root_id, 'Juros Pagos', '8.1', 'expense', true, 'financial'),
            (company_rec.id, new_root_id, 'Multas e Juros', '8.2', 'expense', true, 'financial'),
            (company_rec.id, new_root_id, 'Tarifas Bancárias (Extra)', '8.3', 'expense', true, 'financial');
            
            RAISE NOTICE ' -> Grupo 8.0 criado.';
        ELSE
            RAISE NOTICE ' -> Grupo 8.0 já existe.';
        END IF;

    END LOOP;

    RAISE NOTICE 'Atualização Completa!';
END $$;
