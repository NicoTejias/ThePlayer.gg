-- =============================================================================
-- FIX STORE APPLICATION SYSTEM
-- =============================================================================

-- 1. Ensure table exists with correct schema
CREATE TABLE IF NOT EXISTS public.subscription_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    region TEXT NOT NULL,
    plan_type TEXT CHECK (plan_type IN ('basic', 'medium', 'premium')) NOT NULL,
    message TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Force Enable RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- 3. Reset Policies (Delete old ones to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can submit subscription request" ON public.subscription_requests;
DROP POLICY IF EXISTS "Admins can view all subscription requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Anon insert" ON public.subscription_requests;

-- 4. Create PERMISSIVE Policy for Insert
-- Allows ANYONE (anon or auth) to insert a request
CREATE POLICY "Anyone can submit subscription request"
    ON public.subscription_requests 
    FOR INSERT
    WITH CHECK (true);

-- 5. Create Policy for Select (Only Admins)
-- Using a simpler check for now to ensure at least admin access works
CREATE POLICY "Admins can view all subscription requests"
    ON public.subscription_requests 
    FOR SELECT
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- 6. Grant permissions to roles
GRANT INSERT ON public.subscription_requests TO anon, authenticated;
GRANT SELECT ON public.subscription_requests TO authenticated;

-- 7. Notify configuration reload
NOTIFY pgrst, 'reload config';
