-- =============================================================================
-- FIX PROFILES VISIBILITY
-- =============================================================================

-- 1. Check if profiles exist (Run this part separately if you want to see the output in SQL Editor logs)
DO $$
DECLARE
    count_profiles integer;
BEGIN
    SELECT COUNT(*) INTO count_profiles FROM profiles;
    RAISE NOTICE 'Total profiles in database: %', count_profiles;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Allow Public Read Access
-- This policy allows anyone (even not logged in) to view all profiles.
-- If you want to restrict to only 'is_public' profiles, change TRUE to (is_public = true).
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles 
FOR SELECT 
USING ( true );

-- 4. Grant Permissions
GRANT SELECT ON public.profiles TO anon, authenticated, service_role;

-- 5. Notify
NOTIFY pgrst, 'reload config';
