-- VERIFY RLS VISIBILITY
-- Impersonate the user 'test_final_autopilot_01' to see what they see.

DO $$
DECLARE
    target_user_id uuid;
    visible_count integer;
BEGIN
    -- 1. Get the ID of our test user
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'test_final_autopilot_01@example.com';
    
    -- 2. Simulate User Session (RLS Environment)
    -- This sets the current execution context to act like the API would
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', target_user_id::text, true);
    
    -- 3. Run the SELECT as the user
    SELECT count(*) INTO visible_count FROM categories;
    
    -- 4. Report
    RAISE NOTICE 'User % (ID: %) can see % categories.', 'test_final_autopilot_01', target_user_id, visible_count;
    
    -- Reset to postgres (admin) just in case (though DO block ends scope)
    PERFORM set_config('role', 'postgres', true);
END $$;
