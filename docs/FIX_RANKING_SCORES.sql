-- =============================================================================
-- FIX RANKING SCORES - ThePlayer.gg
-- =============================================================================

-- 1. Asegurar que las funciones de recálculo existan y estén actualizadas
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

CREATE OR REPLACE FUNCTION recalculate_all_players_pwp()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INT := 0;
    v_player RECORD;
BEGIN
    -- 1. Recalcular para todos los que tienen resultados
    FOR v_player IN 
        SELECT DISTINCT player_id 
        FROM tournament_results 
        WHERE player_id IS NOT NULL
    LOOP
        PERFORM recalculate_player_pwp(v_player.player_id);
        v_updated_count := v_updated_count + 1;
    END LOOP;

    -- 2. Asegurar que los que NO tienen resultados tengan 0 en vez de NULL
    UPDATE profiles
    SET pwp = 0, matches_won = 0, matches_lost = 0, matches_drew = 0
    WHERE pwp IS NULL;

    RETURN json_build_object(
        'success', true,
        'updated_players', v_updated_count,
        'message', 'Cálculo masivo completado.'
    );
END;
$$;

-- 2. EJECUTAR EL RECÁLCULO AHORA
SELECT recalculate_all_players_pwp();

-- 3. VERIFICACIÓN (Muestra los top 5 para confirmar que hay datos)
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '--- TOP 5 JUGADORES (VERIFICACIÓN) ---';
    FOR r IN 
        SELECT username, pwp FROM profiles ORDER BY pwp DESC LIMIT 5
    LOOP
        RAISE NOTICE 'Jugador: % | Puntos: %', r.username, r.pwp;
    END LOOP;
    
    -- Verificar si tournament_results está vacío
    IF (SELECT COUNT(*) FROM tournament_results) = 0 THEN
        RAISE NOTICE '⚠️ ADVERTENCIA: La tabla tournament_results está VACÍA. No hay resultados para sumar.';
    ELSE
        RAISE NOTICE '✅ La tabla tournament_results tiene datos.';
    END IF;
END $$;
