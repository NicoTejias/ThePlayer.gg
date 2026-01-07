-- =============================================================================
-- OPTIMIZACIÓN DE RENDIMIENTO DEL RANKING
-- =============================================================================
-- Este script agrega índices para mejorar significativamente el rendimiento
-- de las queries del ranking dinámico
-- =============================================================================

-- 1. ÍNDICES EN TOURNAMENT_RESULTS
-- =============================================================================
RAISE NOTICE 'Creando índices en tournament_results...';

-- Índice en player_id (usado en JOIN)
CREATE INDEX IF NOT EXISTS idx_tournament_results_player_id 
ON tournament_results(player_id);

-- Índice en tournament_id (usado en JOIN)
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id 
ON tournament_results(tournament_id);

-- Índice compuesto para la query principal del ranking
CREATE INDEX IF NOT EXISTS idx_tr_player_tournament 
ON tournament_results(player_id, tournament_id);

RAISE NOTICE '✅ Índices en tournament_results creados';

-- 2. ÍNDICES EN TOURNAMENTS
-- =============================================================================
RAISE NOTICE 'Creando índices en tournaments...';

-- Índice en game_type (usado en WHERE)
CREATE INDEX IF NOT EXISTS idx_tournaments_game_type 
ON tournaments(game_type);

-- Índice en fecha para ordenar torneos recientes
CREATE INDEX IF NOT EXISTS idx_tournaments_date 
ON tournaments(start_date DESC);

RAISE NOTICE '✅ Índices en tournaments creados';

-- 3. ÍNDICES EN PROFILES
-- =============================================================================
RAISE NOTICE 'Creando índices en profiles...';

-- Índice en username para búsquedas
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON profiles(username);

-- Índice en region para filtros
CREATE INDEX IF NOT EXISTS idx_profiles_region 
ON profiles(region);

-- Índice en team_id para joins con teams
CREATE INDEX IF NOT EXISTS idx_profiles_team_id 
ON profiles(team_id);

RAISE NOTICE '✅ Índices en profiles creados';

-- 4. ÍNDICES EN TEAMS
-- =============================================================================
RAISE NOTICE 'Creando índices en teams...';

-- Índice en name para búsquedas
CREATE INDEX IF NOT EXISTS idx_teams_name 
ON teams(name);

RAISE NOTICE '✅ Índices en teams creados';

-- 5. ANALIZAR TABLAS PARA ACTUALIZAR ESTADÍSTICAS
-- =============================================================================
RAISE NOTICE 'Analizando tablas para optimizar query planner...';

ANALYZE tournament_results;
ANALYZE tournaments;
ANALYZE profiles;
ANALYZE teams;

RAISE NOTICE '✅ Análisis completado';

-- 6. VERIFICAR ÍNDICES CREADOS
-- =============================================================================
DO $$
DECLARE
    r RECORD;
    v_index_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ÍNDICES CREADOS ===';
    
    FOR r IN
        SELECT 
            tablename,
            indexname,
            indexdef
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
END $$;

-- 7. ESTIMACIÓN DE MEJORA DE RENDIMIENTO
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MEJORA ESPERADA ===';
    RAISE NOTICE '';
    RAISE NOTICE '📈 Queries de ranking: 5-10x más rápidas';
    RAISE NOTICE '📈 Búsquedas de jugadores: 10-20x más rápidas';
    RAISE NOTICE '📈 Filtros por región: 5-10x más rápidos';
    RAISE NOTICE '';
    RAISE NOTICE '💡 TIP: Ejecuta ANALYZE después de insertar muchos datos nuevos';
    RAISE NOTICE '';
END $$;
