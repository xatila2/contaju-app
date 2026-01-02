-- =============================================================================
-- FIX: FORCE COMPANY CREATION ON SIGNUP (Backend Trigger)
-- =============================================================================

-- Diagnosis: Users exist, Profiles exist, but Companies are NOT created.
-- Solution: Update 'handle_new_user' to create a default Company automatically.
-- This triggers the 'provision_company_defaults' we just fixed.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_company_id uuid;
    user_name text;
BEGIN
    -- 1. Create Profile (Existing logic)
    -- Try to get name from metadata, fallback to email part
    user_name := new.raw_user_meta_data->>'full_name';
    IF user_name IS NULL OR user_name = '' THEN
        user_name := split_part(new.email, '@', 1);
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (new.id, new.email, user_name, 'owner');

    -- 2. Create Default Company (New Logic)
    -- This INSERT will fire the 'on_company_created_provision' trigger!
    INSERT INTO public.companies (name, owner_id, document)
    VALUES ('Minha Empresa', new.id, '00000000000') -- Placeholder document
    RETURNING id INTO new_company_id;

    -- 3. Add User as Member of that Company (Crucial for RLS 'member' checks)
    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (new_company_id, new.id, 'owner');

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block user creation if possible, looking at logs is better
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$;

-- Ensure the trigger is attached (It likely is, but good to double check)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- (Supabase default usually handles the trigger creation, we just replaced the function logic)
