-- =============================================================================
-- OPTIMIZACIÓN DE RENDIMIENTO DEL RANKING (CORREGIDO)
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Creando índices en tournament_results...';
END $$;

-- Índices en tournament_results
CREATE INDEX IF NOT EXISTS idx_tournament_results_player_id 
ON tournament_results(player_id);

CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id 
ON tournament_results(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tr_player_tournament 
ON tournament_results(player_id, tournament_id);

DO $$
BEGIN
    RAISE NOTICE '✅ Índices en tournament_results creados';
    RAISE NOTICE 'Creando índices en tournaments...';
END $$;

-- Índices en tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_game_type 
ON tournaments(game_type);

CREATE INDEX IF NOT EXISTS idx_tournaments_date 
ON tournaments(start_date DESC);

DO $$
BEGIN
    RAISE NOTICE '✅ Índices en tournaments creados';
    RAISE NOTICE 'Creando índices en profiles...';
END $$;

-- Índices en profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON profiles(username);

CREATE INDEX IF NOT EXISTS idx_profiles_region 
ON profiles(region);

CREATE INDEX IF NOT EXISTS idx_profiles_team_id 
ON profiles(team_id);

DO $$
BEGIN
    RAISE NOTICE '✅ Índices en profiles creados';
    RAISE NOTICE 'Creando índices en teams...';
END $$;

-- Índices en teams
CREATE INDEX IF NOT EXISTS idx_teams_name 
ON teams(name);

DO $$
BEGIN
    RAISE NOTICE '✅ Índices en teams creados';
    RAISE NOTICE 'Analizando tablas...';
END $$;

-- Analizar tablas
ANALYZE tournament_results;
ANALYZE tournaments;
ANALYZE profiles;
ANALYZE teams;

DO $$
DECLARE
    r RECORD;
    v_index_count INTEGER := 0;
BEGIN
    RAISE NOTICE '✅ Análisis completado';
    RAISE NOTICE '';
    RAISE NOTICE '=== ÍNDICES CREADOS ===';
    
    FOR r IN
        SELECT 
            tablename,
            indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
    LOOP
        v_index_count := v_index_count + 1;
        RAISE NOTICE '📊 %.%', r.tablename, r.indexname;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total de índices personalizados: %', v_index_count;
    RAISE NOTICE '';
    RAISE NOTICE '=== MEJORA ESPERADA ===';
    RAISE NOTICE '📈 Queries de ranking: 5-10x más rápidas';
    RAISE NOTICE '📈 Búsquedas de jugadores: 10-20x más rápidas';
    RAISE NOTICE '📈 Filtros por región: 5-10x más rápidos';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Optimización completada exitosamente';
END $$;
