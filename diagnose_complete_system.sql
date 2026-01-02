-- ==========================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA DE ONBOARDING
-- ==========================================
-- Este script verifica todos os pontos críticos do fluxo de criação de usuário

-- PARTE 1: VERIFICAR TRIGGERS ATIVOS
SELECT '=== TRIGGERS ATIVOS ===' as section;

SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('users', 'companies', 'categories', 'cost_centers')
  AND t.tgname NOT LIKE 'RI_%'
ORDER BY c.relname, t.tgname;

-- PARTE 2: VERIFICAR POLÍTICAS RLS ATIVAS
SELECT '=== POLÍTICAS RLS ATIVAS ===' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'categories', 'cost_centers', 'company_members')
ORDER BY tablename, policyname;

-- PARTE 3: VERIFICAR ÚLTIMO USUÁRIO CRIADO
SELECT '=== ÚLTIMO USUÁRIO CRIADO ===' as section;

SELECT 
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    (u.raw_user_meta_data->>'full_name') as full_name
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 1;

-- PARTE 4: VERIFICAR SE USUÁRIO TEM EMPRESA
SELECT '=== VERIFICAR EMPRESA DO ÚLTIMO USUÁRIO ===' as section;

WITH last_user AS (
    SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1
)
SELECT 
    'Company as Owner' as relation_type,
    c.id as company_id,
    c.name as company_name,
    c.owner_id,
    c.created_at
FROM public.companies c
JOIN last_user u ON c.owner_id = u.id

UNION ALL

SELECT 
    'Company as Member' as relation_type,
    c.id,
    c.name,
    c.owner_id,
    c.created_at
FROM public.company_members cm
JOIN public.companies c ON cm.company_id = c.id
JOIN last_user u ON cm.user_id = u.id;

-- PARTE 5: VERIFICAR CATEGORIAS DA EMPRESA DO ÚLTIMO USUÁRIO
SELECT '=== CATEGORIAS DA EMPRESA ===' as section;

WITH last_user AS (
    SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
),
user_company AS (
    SELECT id FROM public.companies 
    WHERE owner_id = (SELECT id FROM last_user)
    LIMIT 1
)
SELECT 
    c.id,
    c.name,
    c.code,
    c.type,
    c.parent_id,
    c.is_system_default,
    CASE WHEN c.parent_id IS NULL THEN 'ROOT' ELSE 'CHILD' END as level
FROM public.categories c
WHERE c.company_id = (SELECT id FROM user_company)
ORDER BY c.code;

-- PARTE 6: VERIFICAR CENTROS DE CUSTO DA EMPRESA DO ÚLTIMO USUÁRIO  
SELECT '=== CENTROS DE CUSTO DA EMPRESA ===' as section;

WITH last_user AS (
    SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
),
user_company AS (
    SELECT id FROM public.companies 
    WHERE owner_id = (SELECT id FROM last_user)
    LIMIT 1
)
SELECT 
    cc.id,
    cc.name,
    cc.code,
    cc.is_system_default
FROM public.cost_centers cc
WHERE cc.company_id = (SELECT id FROM user_company)
ORDER BY cc.code;

-- PARTE 7: VERIFICAR FUNÇÕES CRÍTICAS
SELECT '=== FUNÇÕES CRÍTICAS EXISTEM? ===' as section;

SELECT 
    p.proname as function_name,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END as volatility,
    CASE p.prosecdef
        WHEN true THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security
FROM pg_proc p
WHERE p.proname IN (
    'handle_new_user',
    'provision_company_defaults',
    'on_company_created_provision',
    'get_my_company_id',
    'has_company_access'
)
ORDER BY p.proname;

-- PARTE 8: VERIFICAR TEMPLATES GLOBAIS (DEVEM EXISTIR PARA PROVISIONING FUNCIONAR)
SELECT '=== TEMPLATES GLOBAIS (company_id = NULL) ===' as section;

SELECT 
    'Categories' as template_type,
    COUNT(*) as count
FROM public.categories
WHERE company_id IS NULL AND is_system_default = true

UNION ALL

SELECT 
    'Cost Centers' as template_type,
    COUNT(*) as count
FROM public.cost_centers
WHERE company_id IS NULL AND is_system_default = true;

-- PARTE 9: TESTAR RPC COMO USUÁRIO
SELECT '=== TESTE: Simular get_my_company_id() ===' as section;

WITH last_user AS (
    SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
)
SELECT 
    c.id as company_id_as_owner
FROM public.companies c
WHERE c.owner_id = (SELECT id FROM last_user)

UNION

SELECT 
    cm.company_id as company_id_as_member
FROM public.company_members cm
WHERE cm.user_id = (SELECT id FROM last_user)
LIMIT 1;
