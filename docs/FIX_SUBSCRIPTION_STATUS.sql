-- Fix player_subscriptions status constraint
-- This adds 'pending' to the allowed status values

-- Drop the old constraint
ALTER TABLE player_subscriptions DROP CONSTRAINT IF EXISTS player_subscriptions_status_check;

-- Add new constraint with all required status values
ALTER TABLE player_subscriptions 
ADD CONSTRAINT player_subscriptions_status_check 
CHECK (status IN ('pending', 'active', 'paused', 'cancelled', 'expired'));
