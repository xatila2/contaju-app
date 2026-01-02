-- INSPEÇÃO FINAL DOS TEMPLATES
-- Mostra TUDO que está na matriz (company_id IS NULL)
-- Se houver duplicatas, veremos aqui.

SELECT id, code, name, parent_id 
FROM public.categories 
WHERE company_id IS NULL 
ORDER BY code;
