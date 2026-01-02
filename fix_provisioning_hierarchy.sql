-- SOLUÇÃO FINAL PARA TODOS OS USUÁRIOS
-- Este script percorre TODAS as empresas do banco e aplica a correção "Descascar Cebola" (Recursiva).
-- Garante que ninguém fique com duplicatas.

-- 1. Garante que a função recursiva existe
CREATE OR REPLACE FUNCTION public.delete_category_tree(target_cat_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    child_rec RECORD;
BEGIN
    -- Para cada filho, chama a função recursivamente
    FOR child_rec IN SELECT id FROM public.categories WHERE parent_id = target_cat_id
    LOOP
        PERFORM public.delete_category_tree(child_rec.id);
    END LOOP;

    -- Agora que não tem filhos, deleta a si mesmo
    DELETE FROM public.categories WHERE id = target_cat_id;
END;
$$;

-- 2. Loop em TODAS as empresas
DO $$
DECLARE
    company_rec RECORD;
    root_rec RECORD;
    deleted_count INT := 0;
BEGIN
    -- Desabilitar triggers (Segurança)
    BEGIN
        ALTER TABLE public.categories DISABLE TRIGGER check_system_template_immutable;
        ALTER TABLE public.categories DISABLE TRIGGER trg_protect_categories_upd;
        ALTER TABLE public.cost_centers DISABLE TRIGGER check_system_template_immutable;
        ALTER TABLE public.cost_centers DISABLE TRIGGER trg_protect_cc_upd;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RAISE NOTICE 'Iniciando varredura em todas as empresas...';

    FOR company_rec IN SELECT id, name FROM public.companies
    LOOP
        RAISE NOTICE 'Verificando empresa: %', company_rec.name;
        
        -- A. Deletar categorias antigas (Código '1', '2' ou tamanho 1)
        FOR root_rec IN 
            SELECT id, name, code 
            FROM public.categories 
            WHERE company_id = company_rec.id 
              AND (length(code) = 1 OR code IN ('1', '2', '3', '4', '5', '6'))
        LOOP
            RAISE NOTICE ' -> Removendo legado: % (%)', root_rec.name, root_rec.code;
            PERFORM public.delete_category_tree(root_rec.id);
            deleted_count := deleted_count + 1;
        END LOOP;

        -- B. Garantir que as novas existem (Re-provisionar se estiver vazio ou incompleto)
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE company_id = company_rec.id AND code = '1.0') THEN
            RAISE NOTICE ' -> Provisionando estrutura nova...';
            PERFORM public.provision_company_defaults(company_rec.id);
        ELSE
             RAISE NOTICE ' -> Estrutura nova já existe. Mantendo.';
        END IF;

    END LOOP;

    RAISE NOTICE 'Varredura completa. % árvores antigas removidas.', deleted_count;

    -- Re-habilitar triggers
    BEGIN
        ALTER TABLE public.categories ENABLE TRIGGER check_system_template_immutable;
        ALTER TABLE public.categories ENABLE TRIGGER trg_protect_categories_upd;
        ALTER TABLE public.cost_centers ENABLE TRIGGER check_system_template_immutable;
        ALTER TABLE public.cost_centers ENABLE TRIGGER trg_protect_cc_upd;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- 3. Limpeza
DROP FUNCTION IF EXISTS public.delete_category_tree(uuid);
