-- INSPEÇÃO PROFUNDA DOS TEMPLATES
-- Listar TUDO que é template para ver se escapou algo

SELECT 
    id, 
    name, 
    code, 
    parent_id, 
    type,
    created_at
FROM public.categories 
WHERE company_id IS NULL 
ORDER BY code, name;

-- Checar se existe alguma função gatilho que insere coisas 'hardcoded'
-- (Isso é apenas informativo, não vai mostrar o código da função no output padrão do editor sempre)
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'provision_company_defaults';
