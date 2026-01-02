-- VERIFICAÇÃO DE VISIBILIDADE (RLS) PARA LEONARDO
-- Vamos simular se o usuário consegue VER as categorias que o banco diz que ele tem.

DO $$
DECLARE
    target_email text := 'leonardoricardoarantes@gmail.com';
    target_user_id uuid;
    target_company_id uuid;
    count_visible INT;
BEGIN
    -- Pegar IDs
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    SELECT id INTO target_company_id FROM public.companies WHERE owner_id = target_user_id;

    RAISE NOTICE 'Verificando RLS para usuário: % (ID: %)', target_email, target_user_id;
    RAISE NOTICE 'Empresa Alvo: %', target_company_id;

    -- Simular a sessão do usuário (RLS Act)
    -- NOTA: Isso é apenas uma simulação lógica, pois não podemos "logar" como ele aqui via SQL puro sem SET ROLE.
    -- Mas podemos checar as policies.
    
    -- Checagem 1: O usuário é dono da empresa?
    PERFORM * FROM public.companies WHERE id = target_company_id AND owner_id = target_user_id;
    IF FOUND THEN
        RAISE NOTICE '✅ Vínculo Owner -> Company OK';
    ELSE
        RAISE NOTICE '❌ ERRO: O usuário não parece ser o owner da empresa no banco!';
    END IF;

    -- Checagem 2: As categorias novas estão vinculadas a essa empresa?
    SELECT count(*) INTO count_visible 
    FROM public.categories 
    WHERE company_id = target_company_id;
    
    RAISE NOTICE 'Total de Categorias no Banco para esta empresa: %', count_visible;

    -- Checagem 3: Listar amostra para ver se tem algo estranho (ex: type nulo, hidden, etc)
    FOR count_visible IN 0..0 LOOP -- Loop fake só para usar o Record
        RAISE NOTICE '--- AMOSTRA DE DADOS ---';
    END LOOP;
END $$;

SELECT id, name, type, is_system_default, parent_id 
FROM public.categories 
WHERE company_id = (SELECT id FROM public.companies WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'leonardoricardoarantes@gmail.com'))
LIMIT 5;
