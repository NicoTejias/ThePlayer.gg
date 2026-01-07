-- =============================================================================
-- FILTRAR RANKING: SOLO JUGADORES REGISTRADOS (SIN COLUMNA CLAIMED)
-- =============================================================================
-- Este script actualiza get_game_ranking para mostrar SOLO:
-- 1. Jugadores con cuenta registrada (player_id NO NULL)
-- 2. Jugadores que hayan vinculado su nombre (alias en player_aliases)
-- 3. Jugadores con al menos 1 torneo jugado
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
    v_registered_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN DE FILTROS ===';
    RAISE NOTICE '';
    
    -- Contar resultados sin player_id (anónimos)
    SELECT COUNT(*) INTO v_anonymous_count
    FROM tournament_results
    WHERE player_id IS NULL;
    
    -- Contar resultados con player_id (registrados)
    SELECT COUNT(*) INTO v_registered_count
    FROM tournament_results
    WHERE player_id IS NOT NULL;
    
    RAISE NOTICE '📊 Resultados ANÓNIMOS (player_id NULL): %', v_anonymous_count;
    RAISE NOTICE '📊 Resultados REGISTRADOS (player_id NOT NULL): %', v_registered_count;
    RAISE NOTICE '';
    
    -- Contar jugadores registrados en Magic
    SELECT COUNT(*) INTO v_magic_count
    FROM get_game_ranking('Magic: The Gathering');
    
    RAISE NOTICE '✅ Jugadores en ranking de Magic: %', v_magic_count;
    
    -- Contar jugadores registrados en Pokémon
    SELECT COUNT(*) INTO v_pokemon_count
    FROM get_game_ranking('Pokémon TCG');
    
    RAISE NOTICE '✅ Jugadores en ranking de Pokémon: %', v_pokemon_count;
    RAISE NOTICE '';
    
    IF v_magic_count = 0 AND v_pokemon_count = 0 THEN
        RAISE WARNING '⚠️  No hay jugadores registrados con alias vinculados.';
        RAISE NOTICE '💡 Los jugadores deben:';
        RAISE NOTICE '   1. Crear cuenta en ThePlayer.gg';
        RAISE NOTICE '   2. Agregar su alias de Companion/Melee en Configuración';
    ELSE
        RAISE NOTICE '🎉 ¡Ranking filtrado correctamente!';
        RAISE NOTICE '   Solo se muestran jugadores registrados con alias.';
    END IF;
END $$;

-- MOSTRAR TOP 5 PARA VERIFICAR
DO $$
DECLARE
    r RECORD;
    v_pos INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TOP 5 MAGIC (VERIFICACIÓN) ===';
    
    FOR r IN
        SELECT username, first_name, last_name, pwp
        FROM get_game_ranking('Magic: The Gathering')
        LIMIT 5
    LOOP
        v_pos := v_pos + 1;
        RAISE NOTICE '%º @% (% %) - % PWP', 
                     v_pos, r.username, r.first_name, r.last_name, r.pwp;
    END LOOP;
    
    IF v_pos = 0 THEN
        RAISE NOTICE '(Ranking vacío - ningún jugador cumple los requisitos)';
    END IF;
    
    RAISE NOTICE '';
END $$;
