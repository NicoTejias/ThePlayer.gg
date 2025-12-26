-- MercadoPago Integration - Database Updates
-- Run this after PLAYER_PRO_DB.sql

-- 1. Add MercadoPago fields to player_subscriptions
ALTER TABLE player_subscriptions 
ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
ADD COLUMN IF NOT EXISTS mp_payer_id TEXT,
ADD COLUMN IF NOT EXISTS mp_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMP;

-- 2. Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES player_subscriptions(id) ON DELETE CASCADE,
    mp_payment_id TEXT UNIQUE,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'CLP',
    status TEXT CHECK (status IN ('approved', 'pending', 'rejected', 'refunded', 'cancelled')) DEFAULT 'pending',
    status_detail TEXT,
    payment_type TEXT,
    payment_method_id TEXT,
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_mp_id ON payment_history(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_player_subscriptions_mp_preapproval ON player_subscriptions(mp_preapproval_id);

-- 4. Enable RLS on payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for payment_history

-- Players can view their own payment history
CREATE POLICY "Players can view own payment history"
    ON payment_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM player_subscriptions ps
            WHERE ps.id = payment_history.subscription_id
            AND ps.player_id = auth.uid()
        )
    );

-- Admins can view all payment history
CREATE POLICY "Admins can view all payment history"
    ON payment_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only backend (service role) can insert/update payment history
-- This is handled by Edge Functions

-- 6. Create function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_from_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- If payment is approved, update subscription
    IF NEW.status = 'approved' THEN
        UPDATE player_subscriptions
        SET 
            last_payment_date = NEW.payment_date,
            next_payment_date = CASE 
                WHEN plan_type = 'monthly' THEN NEW.payment_date + INTERVAL '1 month'
                WHEN plan_type = 'quarterly' THEN NEW.payment_date + INTERVAL '3 months'
                WHEN plan_type = 'annual' THEN NEW.payment_date + INTERVAL '1 year'
                ELSE NEW.payment_date + INTERVAL '1 month'
            END,
            status = 'active',
            updated_at = NOW()
        WHERE id = NEW.subscription_id;
        
        -- Update profile PRO status
        UPDATE profiles
        SET 
            is_pro = true,
            pro_expires_at = CASE 
                WHEN ps.plan_type = 'monthly' THEN NEW.payment_date + INTERVAL '1 month'
                WHEN ps.plan_type = 'quarterly' THEN NEW.payment_date + INTERVAL '3 months'
                WHEN ps.plan_type = 'annual' THEN NEW.payment_date + INTERVAL '1 year'
                ELSE NEW.payment_date + INTERVAL '1 month'
            END
        FROM player_subscriptions ps
        WHERE profiles.id = ps.player_id
        AND ps.id = NEW.subscription_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for automatic subscription updates
DROP TRIGGER IF EXISTS trigger_update_subscription_from_payment ON payment_history;
CREATE TRIGGER trigger_update_subscription_from_payment
    AFTER INSERT OR UPDATE ON payment_history
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_from_payment();

-- 8. Create function to get payment history for a player
CREATE OR REPLACE FUNCTION get_player_payment_history(player_uuid UUID)
RETURNS TABLE (
    payment_id UUID,
    amount INTEGER,
    currency TEXT,
    status TEXT,
    payment_date TIMESTAMP,
    plan_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ph.id,
        ph.amount,
        ph.currency,
        ph.status,
        ph.payment_date,
        ps.plan_type
    FROM payment_history ph
    JOIN player_subscriptions ps ON ph.subscription_id = ps.id
    WHERE ps.player_id = player_uuid
    ORDER BY ph.payment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant necessary permissions
GRANT SELECT ON payment_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_payment_history TO authenticated;

COMMENT ON TABLE payment_history IS 'Stores payment transaction history from MercadoPago';
COMMENT ON COLUMN payment_history.mp_payment_id IS 'MercadoPago payment ID';
COMMENT ON COLUMN payment_history.status IS 'Payment status: approved, pending, rejected, refunded, cancelled';
