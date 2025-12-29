-- ==============================================================================
-- FIX: Profile Creation & Auto-Approval
-- Description: Ensures users are approved by default and profiles are created automatically.
-- ==============================================================================

-- 1. Alter Table to Default is_approved = TRUE
ALTER TABLE public.profiles ALTER COLUMN is_approved SET DEFAULT true;

-- 2. Update Existing Users to be Approved
UPDATE public.profiles SET is_approved = true;

-- 3. Create/Replace Function to Handle New Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_approved)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user',
    true -- FORCE APPROVED
  )
  ON CONFLICT (id) DO UPDATE
  SET is_approved = true; -- Ensure existing are approved if collision
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Safety: Insert profiles for any orphaned users (users without profiles)
INSERT INTO public.profiles (id, email, is_approved)
SELECT id, email, true
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
