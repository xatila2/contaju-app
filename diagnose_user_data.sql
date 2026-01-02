-- DIAGNOSTIC QUERY (BROAD)
-- Check User existence, and ANY company link (Owner or Member)

SELECT 
    u.id as user_id,
    u.email,
    p.id as profile_id,
    c.id as company_owned_id,
    cm.company_id as member_company_id,
    (SELECT count(*) FROM categories cat WHERE cat.company_id = c.id) as categories_if_owner
FROM 
    auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.owner_id = u.id
LEFT JOIN public.company_members cm ON cm.user_id = u.id
WHERE 
    u.email = 'test_ultimate_01@example.com';
