-- Function to permanently delete a user (admin only)
-- This will cascade delete related data but preserve tournament results (unlinked)

CREATE OR REPLACE FUNCTION admin_delete_user(
    p_user_id UUID,
    p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_username TEXT;
    v_deleted_count INT := 0;
BEGIN
    -- Get current admin user
    v_admin_id := auth.uid();
    
    -- Verify admin role
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = v_admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin role required';
    END IF;

    -- Prevent deleting admin accounts
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Cannot delete admin accounts';
    END IF;

    -- Get username for logging
    SELECT username INTO v_username
    FROM profiles
    WHERE id = p_user_id;

    IF v_username IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Log the action BEFORE deletion
    INSERT INTO admin_actions (
        admin_id,
        target_user_id,
        action_type,
        reason,
        metadata
    ) VALUES (
        v_admin_id,
        p_user_id,
        'delete',
        p_reason,
        jsonb_build_object(
            'username', v_username,
            'deleted_at', NOW()
        )
    );

    -- Delete related data (cascading where configured, manual where needed)
    
    -- 1. Marketplace listings
    DELETE FROM marketplace_listings WHERE seller_id = p_user_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- 2. Favorites
    DELETE FROM favorites WHERE user_id = p_user_id;
    
    -- 3. Notifications
    DELETE FROM notifications WHERE user_id = p_user_id;
    
    -- 4. Player aliases
    DELETE FROM player_aliases WHERE player_id = p_user_id;
    
    -- 5. Event registrations
    DELETE FROM event_registrations WHERE user_id = p_user_id;
    
    -- 6. Judge applications
    DELETE FROM judge_applications WHERE user_id = p_user_id;
    
    -- 7. Content creator applications
    DELETE FROM content_creator_applications WHERE user_id = p_user_id;
    
    -- 8. Admin actions history (where they were the target)
    -- Keep admin actions where they were the admin for audit trail
    DELETE FROM admin_actions WHERE target_user_id = p_user_id;
    
    -- 9. Unlink tournament results (set player_id to NULL, keep player_name)
    -- This preserves tournament history while removing the link to the deleted account
    UPDATE tournament_results 
    SET player_id = NULL
    WHERE player_id = p_user_id;
    
    -- 10. Finally, delete the profile
    DELETE FROM profiles WHERE id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'User deleted successfully',
        'username', v_username,
        'listings_deleted', v_deleted_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error deleting user: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (RLS will check admin role)
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION admin_delete_user IS 'Permanently deletes a user and their related data. Tournament results are preserved but unlinked. Admin only.';
