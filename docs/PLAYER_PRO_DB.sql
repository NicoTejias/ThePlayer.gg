-- =====================================================
-- THEPLAYER PRO - PLAYER SUBSCRIPTION SYSTEM
-- =====================================================
-- Database schema for player premium subscriptions
-- =====================================================

-- 1. Create player_subscriptions table
CREATE TABLE IF NOT EXISTS player_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'trial')) DEFAULT 'active',
    plan_type TEXT CHECK (plan_type IN ('monthly', 'quarterly', 'annual')) DEFAULT 'monthly',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    monthly_price INTEGER NOT NULL DEFAULT 5000,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_id)
);

-- 2. Update profiles table with PRO fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='is_pro') THEN
        ALTER TABLE profiles ADD COLUMN is_pro BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='pro_expires_at') THEN
        ALTER TABLE profiles ADD COLUMN pro_expires_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='custom_banner_url') THEN
        ALTER TABLE profiles ADD COLUMN custom_banner_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='custom_bio') THEN
        ALTER TABLE profiles ADD COLUMN custom_bio TEXT;
    END IF;
END $$;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_player_subscriptions_player_id ON player_subscriptions(player_id);
CREATE INDEX IF NOT EXISTS idx_player_subscriptions_status ON player_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON profiles(is_pro);

-- 4. Enable RLS
ALTER TABLE player_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "Players can view own subscription" ON player_subscriptions;
DROP POLICY IF EXISTS "Admins can view all player subscriptions" ON player_subscriptions;
DROP POLICY IF EXISTS "Admins can manage player subscriptions" ON player_subscriptions;

-- 6. RLS Policies
-- Players can view their own subscription
CREATE POLICY "Players can view own subscription"
    ON player_subscriptions FOR SELECT
    USING (player_id = auth.uid());

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all player subscriptions"
    ON player_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can manage subscriptions
CREATE POLICY "Admins can manage player subscriptions"
    ON player_subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 7. Helper Functions

-- Check if player has active PRO subscription
CREATE OR REPLACE FUNCTION has_active_pro(p_player_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM player_subscriptions
        WHERE player_id = p_player_id
        AND status = 'active'
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    );
END;
$$;

-- Get player PRO status
CREATE OR REPLACE FUNCTION get_pro_status(p_player_id UUID)
RETURNS TABLE(
    is_active BOOLEAN,
    expires_at DATE,
    plan_type TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (ps.status = 'active' AND (ps.end_date IS NULL OR ps.end_date >= CURRENT_DATE)) as is_active,
        ps.end_date as expires_at,
        ps.plan_type
    FROM player_subscriptions ps
    WHERE ps.player_id = p_player_id
    LIMIT 1;
END;
$$;

-- 8. Trigger to update updated_at
DROP TRIGGER IF EXISTS update_player_subscriptions_updated_at ON player_subscriptions;

CREATE OR REPLACE FUNCTION update_player_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_subscriptions_updated_at
    BEFORE UPDATE ON player_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_player_subscription_timestamp();

-- 9. Trigger to sync is_pro field in profiles
CREATE OR REPLACE FUNCTION sync_pro_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile when subscription changes
    UPDATE profiles
    SET 
        is_pro = (NEW.status = 'active' AND (NEW.end_date IS NULL OR NEW.end_date >= CURRENT_DATE)),
        pro_expires_at = NEW.end_date
    WHERE id = NEW.player_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_pro_status_trigger ON player_subscriptions;

CREATE TRIGGER sync_pro_status_trigger
    AFTER INSERT OR UPDATE ON player_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_pro_status();

-- =====================================================
-- NOTES:
-- =====================================================
-- After running this script:
-- 1. Players can subscribe to PRO via payment gateway
-- 2. PRO status is automatically synced to profiles table
-- 3. Use has_active_pro() to check if player has PRO
-- 4. Use get_pro_status() to get detailed PRO info
-- 5. Admins can manage all subscriptions
-- =====================================================
