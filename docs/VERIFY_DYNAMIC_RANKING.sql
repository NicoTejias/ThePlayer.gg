-- =============================================================================
-- VERIFICACIÓN Y CORRECCIÓN DEL RANKING DINÁMICO
-- =============================================================================
-- Este script verifica que el sistema de ranking dinámico esté funcionando
-- y lo corrige si es necesario
-- =============================================================================

-- 1. VERIFICAR QUE LA FUNCIÓN get_game_ranking EXISTE
-- =============================================================================
DO $$
DECLARE
    v_function_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN DE RANKING DINÁMICO ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. Verificando función get_game_ranking...';
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'get_game_ranking'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '   ✅ Función get_game_ranking: EXISTE';
    ELSE
        RAISE WARNING '   ❌ Función get_game_ranking: NO EXISTE';
        RAISE NOTICE '   → Ejecuta el script DYNAMIC_RANKING_RPC.sql';
    END IF;
END $$;

-- 2. VERIFICAR DATOS DE PRUEBA
-- =============================================================================
DO $$
DECLARE
    v_tournament_count INTEGER;
    v_result_count INTEGER;
    v_player_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '2. Verificando datos en la base de datos...';
    
    SELECT COUNT(*) INTO v_tournament_count FROM tournaments;
    SELECT COUNT(*) INTO v_result_count FROM tournament_results;
    SELECT COUNT(*) INTO v_player_count FROM profiles WHERE role = 'player';
    
    RAISE NOTICE '   📊 Torneos: %', v_tournament_count;
    RAISE NOTICE '   📊 Resultados: %', v_result_count;
    RAISE NOTICE '   📊 Jugadores: %', v_player_count;
    
    IF v_result_count = 0 THEN
        RAISE WARNING '   ⚠️  No hay resultados de torneos - El ranking estará vacío';
    END IF;
END $$;

-- 3. PROBAR LA FUNCIÓN CON MAGIC
-- =============================================================================
DO $$
DECLARE
    v_magic_players INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '3. Probando ranking de Magic: The Gathering...';
    
    SELECT COUNT(*) INTO v_magic_players
    FROM get_game_ranking('Magic: The Gathering');
    
    RAISE NOTICE '   📋 Jugadores con puntos en Magic: %', v_magic_players;
    
    IF v_magic_players = 0 THEN
        RAISE WARNING '   ⚠️  No hay jugadores con puntos en Magic';
    ELSE
        RAISE NOTICE '   ✅ Ranking de Magic funcionando';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '   ❌ Error al ejecutar get_game_ranking: %', SQLERRM;
        RAISE NOTICE '   → La función puede no existir o tener errores';
END $$;

-- 4. PROBAR LA FUNCIÓN CON POKÉMON
-- =============================================================================
DO $$
DECLARE
    v_pokemon_players INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '4. Probando ranking de Pokémon TCG...';
    
    SELECT COUNT(*) INTO v_pokemon_players
    FROM get_game_ranking('Pokémon TCG');
    
    RAISE NOTICE '   📋 Jugadores con puntos en Pokémon: %', v_pokemon_players;
    
    IF v_pokemon_players = 0 THEN
        RAISE WARNING '   ⚠️  No hay jugadores con puntos en Pokémon';
    ELSE
        RAISE NOTICE '   ✅ Ranking de Pokémon funcionando';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '   ❌ Error al ejecutar get_game_ranking: %', SQLERRM;
END $$;

-- 5. VERIFICAR TIPOS DE JUEGO EN TORNEOS
-- =============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '5. Tipos de juego en la base de datos:';
    
    FOR r IN
        SELECT DISTINCT game_type, COUNT(*) as count
        FROM tournaments
        GROUP BY game_type
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '   🎮 %: % torneos', r.game_type, r.count;
    END LOOP;
END $$;

-- 6. MOSTRAR TOP 5 DE MAGIC (SI EXISTE)
-- =============================================================================
DO $$
DECLARE
    r RECORD;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '6. Top 5 jugadores de Magic:';
    
    FOR r IN
        SELECT username, pwp, matches_won
        FROM get_game_ranking('Magic: The Gathering')
        LIMIT 5
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE '   %º %: % PWP (% victorias)', 
                     v_count, r.username, r.pwp, r.matches_won;
    END LOOP;
    
    IF v_count = 0 THEN
        RAISE NOTICE '   (No hay jugadores en el ranking de Magic)';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '   (No se pudo obtener el ranking)';
END $$;

-- 7. RESUMEN Y RECOMENDACIONES
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMEN ===';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACCIONES RECOMENDADAS:';
    RAISE NOTICE '1. Si get_game_ranking NO existe, ejecuta: docs/DYNAMIC_RANKING_RPC.sql';
    RAISE NOTICE '2. Si no hay datos, verifica que los torneos tengan game_type correcto';
    RAISE NOTICE '3. Si hay errores, revisa los mensajes arriba';
    RAISE NOTICE '4. Prueba el ranking en el frontend cambiando entre juegos';
    RAISE NOTICE '';
END $$;
