-- =============================================================================
-- RECREAR FUNCIÓN get_game_ranking (CORREGIDO)
-- =============================================================================
-- Este script elimina y recrea la función get_game_ranking correctamente
-- =============================================================================

-- 1. ELIMINAR LA FUNCIÓN EXISTENTE
-- =============================================================================
DROP FUNCTION IF EXISTS public.get_game_ranking(TEXT);

-- 2. CREAR LA FUNCIÓN CON LA FIRMA CORRECTA
-- =============================================================================
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
    LEFT JOIN tournament_results tr ON p.id = tr.player_id
    LEFT JOIN tournaments t ON tr.tournament_id = t.id
    WHERE t.game_type = p_game_type OR t.game_type IS NULL
    GROUP BY p.id
    HAVING COALESCE(SUM(tr.pwp_earned), 0) > 0
    ORDER BY pwp DESC;
END;
$$;

-- 3. OTORGAR PERMISOS
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.get_game_ranking(TEXT) TO anon, authenticated;

-- 4. VERIFICAR QUE LA FUNCIÓN FUNCIONA
-- =============================================================================
DO $$
DECLARE
    v_magic_count INTEGER;
    v_pokemon_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN DE get_game_ranking ===';
    RAISE NOTICE '';
    
    -- Probar con Magic
    SELECT COUNT(*) INTO v_magic_count
    FROM get_game_ranking('Magic: The Gathering');
    
    RAISE NOTICE '✅ Función creada exitosamente';
    RAISE NOTICE '📊 Jugadores en Magic: %', v_magic_count;
    
    -- Probar con Pokémon
    SELECT COUNT(*) INTO v_pokemon_count
    FROM get_game_ranking('Pokémon TCG');
    
    RAISE NOTICE '📊 Jugadores en Pokémon: %', v_pokemon_count;
    RAISE NOTICE '';
    
    IF v_magic_count = 0 AND v_pokemon_count = 0 THEN
        RAISE WARNING '⚠️  No hay datos de torneos. El ranking estará vacío.';
        RAISE NOTICE '💡 Agrega torneos y resultados para ver el ranking.';
    ELSE
        RAISE NOTICE '🎉 ¡Ranking dinámico funcionando correctamente!';
    END IF;
END $$;
