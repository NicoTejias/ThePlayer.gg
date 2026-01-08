-- 1. Create admin_actions table to fix the RPC error
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES profiles(id),
    target_user_id UUID,
    action_type TEXT NOT NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- create policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'Admins can view all actions'
    ) THEN
        CREATE POLICY "Admins can view all actions" ON admin_actions
            FOR SELECT
            USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'Admins can insert actions'
    ) THEN
        CREATE POLICY "Admins can insert actions" ON admin_actions
            FOR INSERT
            WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END
$$;

GRANT ALL ON admin_actions TO postgres;
GRANT ALL ON admin_actions TO authenticated;
GRANT ALL ON admin_actions TO service_role;

-- 2. Bulk Delete Users without Email
DO $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
    v_count INT := 0;
BEGIN
    -- Temporary table to hold users to delete
    CREATE TEMP TABLE users_to_delete AS
    SELECT id, username 
    FROM profiles 
    WHERE email IS NULL OR email = '';

    -- Log info
    RAISE NOTICE 'Found % users to delete', (SELECT COUNT(*) FROM users_to_delete);

    -- Iterate and delete
    FOR v_user_id, v_username IN SELECT id, username FROM users_to_delete
    LOOP
        RAISE NOTICE 'Deleting user: % (%)', v_username, v_user_id;

        -- 1. Marketplace listings
        DELETE FROM marketplace_listings WHERE seller_id = v_user_id;
        
        -- 2. Favorites
        DELETE FROM favorites WHERE user_id = v_user_id;
        
        -- 3. Notifications
        DELETE FROM notifications WHERE user_id = v_user_id;
        
        -- 4. Player aliases
        DELETE FROM player_aliases WHERE player_id = v_user_id;
        
        -- 5. Event registrations
        DELETE FROM event_registrations WHERE user_id = v_user_id;
        
        -- 6. Judge applications
        DELETE FROM judge_applications WHERE user_id = v_user_id;
        
        -- 7. Content creator applications
        DELETE FROM content_creator_applications WHERE user_id = v_user_id;

        -- 8. Admin actions (as target)
        DELETE FROM admin_actions WHERE target_user_id = v_user_id;
        
        -- 9. Unlink tournament results
        UPDATE tournament_results 
        SET player_id = NULL
        WHERE player_id = v_user_id;
        
        -- 10. Delete profile
        DELETE FROM profiles WHERE id = v_user_id;
        
        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Successfully deleted % users.', v_count;
    
    -- Cleanup
    DROP TABLE users_to_delete;
END $$;
