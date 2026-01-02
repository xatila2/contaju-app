-- DIAGNÓSTICO ESPECÍFICO: leonardoricardoarantes@gmail.com

SELECT 
    u.email,
    c.name as empresa,
    c.id as company_id,
    -- Contagem de categorias ANTIGAS (Lixo)
    (SELECT count(*) FROM public.categories cat 
     WHERE cat.company_id = c.id 
     AND (cat.code = '1' OR length(cat.code) = 1)) as qtd_antigas_legado,
     
    -- Contagem de categorias NOVAS (Corretas)
    (SELECT count(*) FROM public.categories cat 
     WHERE cat.company_id = c.id 
     AND cat.code = '1.0') as qtd_novas_corretas
FROM auth.users u
JOIN public.companies c ON c.owner_id = u.id
WHERE u.email = 'leonardoricardoarantes@gmail.com';
