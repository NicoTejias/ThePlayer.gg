-- =============================================================================
-- SPRINT 2 - DATABASE OPTIMIZATIONS (ThePlayer.gg)
-- Ejecutar en el editor SQL de tu panel de Supabase
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Iniciando optimización de base de datos para Sprint 2...';
END $$;

-- 1. Indexación para matching rápido e insensible a mayúsculas/minúsculas en carga masiva
-- Acelera significativamente la consulta en process_tournament_results_bulk:
-- SELECT player_id FROM player_aliases WHERE LOWER(alias_name) = LOWER(v_player_name)
CREATE INDEX IF NOT EXISTS idx_player_aliases_lower_name 
ON player_aliases (LOWER(alias_name));

-- Acelera el fallback de búsqueda en perfiles:
-- SELECT id FROM profiles WHERE LOWER(username) = LOWER(v_player_name)
CREATE INDEX IF NOT EXISTS idx_profiles_lower_username 
ON profiles (LOWER(username));

-- 2. Asegurar índices de rendimiento de rankings competitivos (si no existen)
CREATE INDEX IF NOT EXISTS idx_tournament_results_player_id 
ON tournament_results(player_id);

CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id 
ON tournament_results(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tr_player_tournament 
ON tournament_results(player_id, tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournaments_game_type 
ON tournaments(game_type);

-- 3. Optimización para búsquedas por ranking y fecha de torneos
CREATE INDEX IF NOT EXISTS idx_tournaments_date 
ON tournaments(date DESC);

-- 4. Ejecutar análisis de tablas para actualizar estadísticas del planificador de queries
ANALYZE player_aliases;
ANALYZE profiles;
ANALYZE tournament_results;
ANALYZE tournaments;

DO $$
BEGIN
    RAISE NOTICE '✅ Optimización completada exitosamente.';
    RAISE NOTICE 'Índices creados en player_aliases, profiles, tournaments y tournament_results.';
END $$;
