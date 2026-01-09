-- ============================================================================
-- FIX: admin_delete_tournament_safe
-- Error reportado: "column pwp does not exist"
-- ============================================================================

-- 1. Primero, asegurarnos de que la función de recálculo existe y es correcta
CREATE OR REPLACE FUNCTION recalculate_player_pwp(p_player_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_pwp INT;
    v_total_wins INT;
    v_total_losses INT;
    v_total_draws INT;
BEGIN
    -- Calcular totales desde tournament_results
    SELECT 
        COALESCE(SUM(pwp_earned), 0),
        COALESCE(SUM(wins), 0),
        COALESCE(SUM(losses), 0),
        COALESCE(SUM(draws), 0)
    INTO v_total_pwp, v_total_wins, v_total_losses, v_total_draws
    FROM tournament_results
    WHERE player_id = p_player_id;

    -- Actualizar el perfil
    UPDATE profiles
    SET 
        pwp = v_total_pwp,
        matches_won = v_total_wins,
        matches_lost = v_total_losses,
        matches_drew = v_total_draws,
        updated_at = NOW()
    WHERE id = p_player_id;

    RETURN json_build_object(
        'success', true,
        'player_id', p_player_id,
        'pwp', v_total_pwp
    );
END;
$$;

-- 2. Redefinir la función de borrado seguro
DROP FUNCTION IF EXISTS admin_delete_tournament_safe(uuid, text);

CREATE OR REPLACE FUNCTION admin_delete_tournament_safe(
    p_tournament_id UUID, 
    p_reason TEXT DEFAULT 'Admin deletion'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player_ids UUID[];
    v_deleted_results INT;
    v_player_id UUID;
    v_recalculated_count INT := 0;
BEGIN
    -- 1. Identificar jugadores afectados antes de borrar
    SELECT ARRAY_AGG(DISTINCT player_id)
    INTO v_player_ids
    FROM tournament_results
    WHERE tournament_id = p_tournament_id AND player_id IS NOT NULL;

    -- 2. Eliminar resultados
    DELETE FROM tournament_results
    WHERE tournament_id = p_tournament_id;
    
    GET DIAGNOSTICS v_deleted_results = ROW_COUNT;

    -- 3. Eliminar el torneo
    DELETE FROM tournaments
    WHERE id = p_tournament_id;

    -- 4. Recalcular PWP para los jugadores afectados
    IF v_player_ids IS NOT NULL THEN
        FOREACH v_player_id IN ARRAY v_player_ids
        LOOP
            PERFORM recalculate_player_pwp(v_player_id);
            v_recalculated_count := v_recalculated_count + 1;
        END LOOP;
    END IF;

    -- 5. Registrar log de auditoría (opcional, si existe tabla de logs)
    -- INSERT INTO admin_logs ...

    RETURN json_build_object(
        'success', true,
        'deleted_tournament_id', p_tournament_id,
        'affected_players', v_recalculated_count,
        'deleted_results', v_deleted_results,
        'message', 'Torneo eliminado y PWP recalculado'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'hint', 'Contactar soporte'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_tournament_safe(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_player_pwp(UUID) TO authenticated;
