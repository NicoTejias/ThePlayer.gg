-- =============================================================================
-- DIAGNÓSTICO: ¿POR QUÉ APARECEN JUGADORES ANÓNIMOS?
-- =============================================================================
-- Este script investiga por qué los jugadores anónimos siguen apareciendo
-- =============================================================================

-- 1. VERIFICAR SI LOS JUGADORES ANÓNIMOS TIENEN player_id
-- =============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== DIAGNÓSTICO DE JUGADORES ANÓNIMOS ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. Verificando jugadores que aparecen en el ranking...';
    RAISE NOTICE '';
    
    FOR r IN
        SELECT 
            tr.player_name,
            tr.player_id,
            p.username,
            COUNT(*) as veces_jugado,
            SUM(tr.pwp_earned) as total_pwp,
            tr.claimed
        FROM tournament_results tr
        LEFT JOIN profiles p ON tr.player_id = p.id
        LEFT JOIN tournaments t ON tr.tournament_id = t.id
        WHERE t.game_type::TEXT = 'Magic: The Gathering'
        GROUP BY tr.player_name, tr.player_id, p.username, tr.claimed
        HAVING SUM(tr.pwp_earned) > 0
        ORDER BY SUM(tr.pwp_earned) DESC
        LIMIT 10
    LOOP
        IF r.player_id IS NULL THEN
            RAISE NOTICE '❌ ANÓNIMO: "%" - % PWP - player_id: NULL - claimed: %', 
                         r.player_name, r.total_pwp, r.claimed;
        ELSE
            RAISE NOTICE '✅ REGISTRADO: "%" (@%) - % PWP - claimed: %', 
                         r.player_name, r.username, r.total_pwp, r.claimed;
        END IF;
    END LOOP;
END $$;

-- 2. VERIFICAR SI TIENEN ALIAS REGISTRADOS
-- =============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '2. Verificando alias registrados...';
    RAISE NOTICE '';
    
    FOR r IN
        SELECT 
            p.username,
            p.id,
            COUNT(pa.id) as alias_count,
            STRING_AGG(pa.alias_name, ', ') as aliases
        FROM profiles p
        LEFT JOIN player_aliases pa ON p.id = pa.player_id
        WHERE p.role = 'player'
        GROUP BY p.id, p.username
        ORDER BY p.username
    LOOP
        IF r.alias_count = 0 THEN
            RAISE NOTICE '⚠️  @% - SIN ALIAS registrados', r.username;
        ELSE
            RAISE NOTICE '✅ @% - % alias: %', r.username, r.alias_count, r.aliases;
        END IF;
    END LOOP;
END $$;

-- 3. VERIFICAR LA FUNCIÓN get_game_ranking ACTUAL
-- =============================================================================
DO $$
DECLARE
    v_function_def TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '3. Verificando definición de get_game_ranking...';
    RAISE NOTICE '';
    
    SELECT pg_get_functiondef(oid) INTO v_function_def
    FROM pg_proc
    WHERE proname = 'get_game_ranking';
    
    IF v_function_def LIKE '%INNER JOIN%' THEN
        RAISE NOTICE '✅ Usa INNER JOIN (correcto)';
    ELSE
        RAISE NOTICE '❌ Usa LEFT JOIN (incorrecto - permite anónimos)';
    END IF;
    
    IF v_function_def LIKE '%player_id IS NOT NULL%' THEN
        RAISE NOTICE '✅ Filtra player_id IS NOT NULL';
    ELSE
        RAISE NOTICE '⚠️  NO filtra player_id IS NOT NULL';
    END IF;
    
    IF v_function_def LIKE '%player_aliases%' THEN
        RAISE NOTICE '✅ Verifica que tenga alias';
    ELSE
        RAISE NOTICE '⚠️  NO verifica alias';
    END IF;
END $$;

-- 4. PROBAR LA FUNCIÓN ACTUAL
-- =============================================================================
DO $$
DECLARE
    r RECORD;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '4. Probando get_game_ranking actual...';
    RAISE NOTICE '';
    
    FOR r IN
        SELECT username, pwp
        FROM get_game_ranking('Magic: The Gathering')
        LIMIT 10
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE '%º @% - % PWP', v_count, r.username, r.pwp;
    END LOOP;
    
    IF v_count = 0 THEN
        RAISE NOTICE '(Ranking vacío)';
    END IF;
END $$;

-- 5. RESUMEN Y RECOMENDACIONES
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMEN ===';
    RAISE NOTICE '';
    RAISE NOTICE '📋 POSIBLES CAUSAS:';
    RAISE NOTICE '1. Los jugadores "anónimos" SÍ tienen player_id (están registrados)';
    RAISE NOTICE '2. La función get_game_ranking NO se actualizó correctamente';
    RAISE NOTICE '3. El frontend tiene cache y muestra datos antiguos';
    RAISE NOTICE '';
    RAISE NOTICE '💡 SOLUCIONES:';
    RAISE NOTICE '1. Ejecuta FILTER_REGISTERED_PLAYERS_ONLY.sql';
    RAISE NOTICE '2. Recarga el frontend (Ctrl+Shift+R)';
    RAISE NOTICE '3. Verifica que los jugadores NO tengan alias registrados';
    RAISE NOTICE '';
END $$;
