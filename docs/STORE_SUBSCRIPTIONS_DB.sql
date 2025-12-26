-- =====================================================
-- STORE SUBSCRIPTION SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This script creates the necessary tables and functions
-- for the store subscription system
-- =====================================================

-- 1. Create subscription_requests table
-- This stores initial subscription requests from stores
CREATE TABLE IF NOT EXISTS subscription_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    region TEXT NOT NULL,
    plan_type TEXT CHECK (plan_type IN ('basic', 'medium', 'premium')) NOT NULL,
    message TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create store_subscriptions table
-- This stores active subscriptions for stores
CREATE TABLE IF NOT EXISTS store_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_type TEXT CHECK (plan_type IN ('basic', 'medium', 'premium')) NOT NULL,
    status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'trial')) DEFAULT 'active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    monthly_price INTEGER NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(store_id) -- One subscription per store
);

-- 3. Update profiles table to include subscription info
-- Add columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='subscription_tier') THEN
        ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='subscription_expires_at') THEN
        ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='featured_until') THEN
        ALTER TABLE profiles ADD COLUMN featured_until TIMESTAMP;
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_created_at ON subscription_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_store_id ON store_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_status ON store_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for subscription_requests
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can submit subscription request" ON subscription_requests;
DROP POLICY IF EXISTS "Admins can view all subscription requests" ON subscription_requests;
DROP POLICY IF EXISTS "Admins can update subscription requests" ON subscription_requests;
DROP POLICY IF EXISTS "Stores can view own subscription" ON store_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON store_subscriptions;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON store_subscriptions;

-- Allow anyone to insert (submit request)
CREATE POLICY "Anyone can submit subscription request"
    ON subscription_requests FOR INSERT
    WITH CHECK (true);

-- Only admins can view all requests
CREATE POLICY "Admins can view all subscription requests"
    ON subscription_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can update requests
CREATE POLICY "Admins can update subscription requests"
    ON subscription_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 7. RLS Policies for store_subscriptions
-- Stores can view their own subscription
CREATE POLICY "Stores can view own subscription"
    ON store_subscriptions FOR SELECT
    USING (store_id = auth.uid());

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
    ON store_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can manage subscriptions
CREATE POLICY "Admins can manage subscriptions"
    ON store_subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 8. Create function to check if store has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_store_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM store_subscriptions
        WHERE store_id = p_store_id
        AND status = 'active'
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    );
END;
$$;

-- 9. Create function to get store subscription tier
CREATE OR REPLACE FUNCTION get_subscription_tier(p_store_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_tier TEXT;
BEGIN
    SELECT plan_type INTO v_tier
    FROM store_subscriptions
    WHERE store_id = p_store_id
    AND status = 'active'
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    LIMIT 1;
    
    RETURN COALESCE(v_tier, 'free');
END;
$$;

-- 10. Create trigger to update updated_at timestamp
-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_subscription_requests_updated_at ON subscription_requests;
DROP TRIGGER IF EXISTS update_store_subscriptions_updated_at ON store_subscriptions;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_requests_updated_at
    BEFORE UPDATE ON subscription_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_subscriptions_updated_at
    BEFORE UPDATE ON store_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- NOTES:
-- =====================================================
-- After running this script:
-- 1. Stores can submit subscription requests via the modal
-- 2. Admins can review and approve requests
-- 3. Once approved, create a store_subscriptions record
-- 4. The subscription tier will automatically update in profiles
-- 5. Use has_active_subscription() to check subscription status
-- 6. Use get_subscription_tier() to get the current tier
-- =====================================================
