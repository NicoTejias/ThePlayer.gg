-- =============================================================================
-- FILTRAR RANKING: SOLO JUGADORES REGISTRADOS Y VINCULADOS
-- =============================================================================
-- Este script actualiza get_game_ranking para mostrar SOLO:
-- 1. Jugadores con cuenta registrada (player_id NO NULL en tournament_results)
-- 2. Jugadores que hayan vinculado su nombre (alias en player_aliases)
-- 3. Jugadores con al menos 1 torneo jugado
-- 4. Jugadores con puntos reclamados (claimed = true)
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_game_ranking(TEXT);

CREATE OR REPLACE FUNCTION public.get_game_ranking(p_game_type TEXT)
RETURNS TABLE (
    id UUID,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    region TEXT,
    team TEXT,
    team_id UUID,
    is_public BOOLEAN,
    is_pro BOOLEAN,
    pwp BIGINT,
    matches_won BIGINT,
    matches_lost BIGINT,
    matches_drew BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.first_name,
        p.last_name,
        p.region,
        p.team,
        p.team_id,
        p.is_public,
        p.is_pro,
        COALESCE(SUM(tr.pwp_earned), 0)::BIGINT as pwp,
        COALESCE(SUM(tr.wins), 0)::BIGINT as matches_won,
        COALESCE(SUM(tr.losses), 0)::BIGINT as matches_lost,
        COALESCE(SUM(tr.draws), 0)::BIGINT as matches_drew
    FROM profiles p
    INNER JOIN tournament_results tr ON p.id = tr.player_id  -- INNER JOIN = solo registrados
    INNER JOIN tournaments t ON tr.tournament_id = t.id
    WHERE 
        t.game_type::TEXT = p_game_type
        AND tr.player_id IS NOT NULL  -- Solo resultados con jugador vinculado
        AND tr.claimed = true  -- Solo puntos reclamados
        AND EXISTS (
            -- Verificar que el jugador tenga al menos un alias registrado
            SELECT 1 FROM player_aliases pa
            WHERE pa.player_id = p.id
        )
    GROUP BY p.id
    HAVING 
        COALESCE(SUM(tr.pwp_earned), 0) > 0  -- Solo con puntos
        AND COUNT(DISTINCT tr.tournament_id) >= 1  -- Al menos 1 torneo
    ORDER BY pwp DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_game_ranking(TEXT) TO anon, authenticated;

-- VERIFICAR
DO $$
DECLARE
    v_magic_count INTEGER;
    v_pokemon_count INTEGER;
    v_anonymous_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN DE FILTROS ===';
    RAISE NOTICE '';
    
    -- Contar jugadores anónimos (sin player_id)
    SELECT COUNT(DISTINCT player_name) INTO v_anonymous_count
    FROM tournament_results
    WHERE player_id IS NULL;
    
    RAISE NOTICE '📊 Jugadores anónimos en BD: % (NO aparecerán en ranking)', v_anonymous_count;
    RAISE NOTICE '';
    
    -- Contar jugadores registrados en Magic
    SELECT COUNT(*) INTO v_magic_count
    FROM get_game_ranking('Magic: The Gathering');
    
    RAISE NOTICE '✅ Jugadores REGISTRADOS en Magic: %', v_magic_count;
    
    -- Contar jugadores registrados en Pokémon
    SELECT COUNT(*) INTO v_pokemon_count
    FROM get_game_ranking('Pokémon TCG');
    
    RAISE NOTICE '✅ Jugadores REGISTRADOS en Pokémon: %', v_pokemon_count;
    RAISE NOTICE '';
    
    IF v_magic_count = 0 AND v_pokemon_count = 0 THEN
        RAISE WARNING '⚠️  No hay jugadores registrados con alias vinculados.';
        RAISE NOTICE '💡 Los jugadores deben:';
        RAISE NOTICE '   1. Crear cuenta en ThePlayer.gg';
        RAISE NOTICE '   2. Agregar su alias de Companion/Melee en Configuración';
        RAISE NOTICE '   3. Reclamar sus puntos';
    ELSE
        RAISE NOTICE '🎉 ¡Ranking filtrado correctamente!';
        RAISE NOTICE '   Solo se muestran jugadores registrados y vinculados.';
    END IF;
END $$;
