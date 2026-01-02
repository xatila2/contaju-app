-- DIAGNÓSTICO DE USUÁRIOS ANTIGOS
-- Lista as 5 últimas empresas criadas e mostra se têm duplicatas

SELECT 
    c.name as empresa,
    u.email as dono,
    c.id as company_id,
    (SELECT count(*) FROM public.categories cat WHERE cat.company_id = c.id AND (cat.code = '1' OR length(cat.code) = 1)) as qtd_antigas,
    (SELECT count(*) FROM public.categories cat WHERE cat.company_id = c.id AND cat.code = '1.0') as qtd_novas
FROM public.companies c
JOIN auth.users u ON c.owner_id = u.id
ORDER BY c.created_at DESC
LIMIT 5;

-- Se a coluna "qtd_antigas" for maior que 0, esse usuário precisa rodar o fix.
