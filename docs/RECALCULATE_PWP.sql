-- ============================================================================
-- FIX: Recalcular PWP desde tournament_results
-- ============================================================================
-- PROBLEMA: Los puntos PWP en la tabla 'profiles' están desactualizados
-- porque se calculan al momento de subir torneos, pero pueden haber
-- inconsistencias si se eliminan torneos o se corrigen resultados.
--
-- SOLUCIÓN: Recalcular todos los PWP desde tournament_results
-- ============================================================================

-- Función para recalcular PWP de un jugador específico
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
        'pwp', v_total_pwp,
        'wins', v_total_wins,
        'losses', v_total_losses,
        'draws', v_total_draws
    );
END;
$$;

-- Función para recalcular PWP de TODOS los jugadores
CREATE OR REPLACE FUNCTION recalculate_all_players_pwp()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INT := 0;
    v_player RECORD;
BEGIN
    -- Iterar sobre todos los jugadores
    FOR v_player IN 
        SELECT DISTINCT player_id 
        FROM tournament_results 
        WHERE player_id IS NOT NULL
    LOOP
        PERFORM recalculate_player_pwp(v_player.player_id);
        v_updated_count := v_updated_count + 1;
    END LOOP;

    -- También resetear jugadores que no tienen resultados
    UPDATE profiles
    SET 
        pwp = 0,
        matches_won = 0,
        matches_lost = 0,
        matches_drew = 0,
        updated_at = NOW()
    WHERE role = 'player'
      AND id NOT IN (
          SELECT DISTINCT player_id 
          FROM tournament_results 
          WHERE player_id IS NOT NULL
      );

    RETURN json_build_object(
        'success', true,
        'updated_players', v_updated_count,
        'message', 'PWP recalculado para todos los jugadores'
    );
END;
$$;

-- Función para recalcular PWP filtrado por juego
CREATE OR REPLACE FUNCTION recalculate_pwp_by_game(p_game_type TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INT := 0;
    v_player RECORD;
BEGIN
    -- Iterar sobre jugadores que tienen resultados en este juego
    FOR v_player IN 
        SELECT DISTINCT tr.player_id 
        FROM tournament_results tr
        INNER JOIN tournaments t ON t.id = tr.tournament_id
        WHERE tr.player_id IS NOT NULL
          AND t.game_type = p_game_type
    LOOP
        -- Calcular totales para este juego específico
        UPDATE profiles p
        SET 
            pwp = (
                SELECT COALESCE(SUM(tr.pwp_earned), 0)
                FROM tournament_results tr
                INNER JOIN tournaments t ON t.id = tr.tournament_id
                WHERE tr.player_id = v_player.player_id
                  AND t.game_type = p_game_type
            ),
            matches_won = (
                SELECT COALESCE(SUM(tr.wins), 0)
                FROM tournament_results tr
                INNER JOIN tournaments t ON t.id = tr.tournament_id
                WHERE tr.player_id = v_player.player_id
                  AND t.game_type = p_game_type
            ),
            matches_lost = (
                SELECT COALESCE(SUM(tr.losses), 0)
                FROM tournament_results tr
                INNER JOIN tournaments t ON t.id = tr.tournament_id
                WHERE tr.player_id = v_player.player_id
                  AND t.game_type = p_game_type
            ),
            matches_drew = (
                SELECT COALESCE(SUM(tr.draws), 0)
                FROM tournament_results tr
                INNER JOIN tournaments t ON t.id = tr.tournament_id
                WHERE tr.player_id = v_player.player_id
                  AND t.game_type = p_game_type
            ),
            updated_at = NOW()
        WHERE p.id = v_player.player_id;
        
        v_updated_count := v_updated_count + 1;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'game_type', p_game_type,
        'updated_players', v_updated_count
    );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION recalculate_player_pwp(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_players_pwp() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_pwp_by_game(TEXT) TO authenticated;

-- ============================================================================
-- INSTRUCCIONES DE USO:
-- ============================================================================

-- 1. Para recalcular un jugador específico:
-- SELECT recalculate_player_pwp('uuid-del-jugador');

-- 2. Para recalcular TODOS los jugadores:
-- SELECT recalculate_all_players_pwp();

-- 3. Para recalcular jugadores de un juego específico:
-- SELECT recalculate_pwp_by_game('mtg');

-- ============================================================================
-- NOTA IMPORTANTE:
-- ============================================================================
-- El problema de fondo es que el sistema actual usa DOS fuentes de verdad:
-- 1. La columna 'pwp' en 'profiles' (se actualiza al subir torneos)
-- 2. La suma de 'pwp_earned' en 'tournament_results' (fuente real)
--
-- RECOMENDACIÓN: Modificar el panel de administración para que calcule
-- los PWP dinámicamente desde tournament_results en lugar de usar la
-- columna 'pwp' de profiles.
-- ============================================================================
