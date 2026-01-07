-- =============================================================================
-- HEALTH CHECK - Verificación de Salud del Sistema
-- =============================================================================
-- Ejecuta este script semanalmente para verificar el estado del sistema
-- =============================================================================

-- 1. VERIFICAR ESTADO DE RLS
-- =============================================================================
DO $$
DECLARE
    v_tables_without_rls INTEGER;
    v_tables_without_policies INTEGER;
BEGIN
    RAISE NOTICE '=== HEALTH CHECK - ThePlayer.gg ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. Verificando Row Level Security...';
    
    -- Contar tablas sin RLS
    SELECT COUNT(*) INTO v_tables_without_rls
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename NOT LIKE 'pg_%';
    
    -- Contar tablas con RLS pero sin políticas
    SELECT COUNT(*) INTO v_tables_without_policies
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.rowsecurity = true
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = t.schemaname
        AND p.tablename = t.tablename
    );
    
    IF v_tables_without_rls = 0 AND v_tables_without_policies = 0 THEN
        RAISE NOTICE '   ✅ RLS: OK - Todas las tablas protegidas';
    ELSE
        RAISE WARNING '   ❌ RLS: PROBLEMA - % tablas sin RLS, % sin políticas', 
                      v_tables_without_rls, v_tables_without_policies;
    END IF;
END $$;

-- 2. VERIFICAR INTEGRIDAD DE DATOS
-- =============================================================================
DO $$
DECLARE
    v_orphaned_results INTEGER;
    v_orphaned_aliases INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '2. Verificando integridad de datos...';
    
    -- Resultados de torneos sin jugador
    SELECT COUNT(*) INTO v_orphaned_results
    FROM tournament_results tr
    WHERE tr.player_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = tr.player_id
    );
    
    -- Alias sin jugador
    SELECT COUNT(*) INTO v_orphaned_aliases
    FROM player_aliases pa
    WHERE NOT EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = pa.player_id
    );
    
    IF v_orphaned_results = 0 AND v_orphaned_aliases = 0 THEN
        RAISE NOTICE '   ✅ Integridad: OK - No hay datos huérfanos';
    ELSE
        RAISE WARNING '   ⚠️  Integridad: % resultados huérfanos, % alias huérfanos', 
                      v_orphaned_results, v_orphaned_aliases;
    END IF;
END $$;

-- 3. VERIFICAR RENDIMIENTO DE QUERIES
-- =============================================================================
DO $$
DECLARE
    v_slow_queries INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '3. Verificando rendimiento...';
    
    -- Contar queries lentas (>1 segundo) en las últimas 24h
    -- Nota: Esto requiere pg_stat_statements extension
    SELECT COUNT(*) INTO v_slow_queries
    FROM pg_stat_statements
    WHERE mean_exec_time > 1000  -- 1 segundo
    AND calls > 10  -- Ejecutada más de 10 veces
    LIMIT 1;
    
    IF v_slow_queries = 0 THEN
        RAISE NOTICE '   ✅ Rendimiento: OK - No hay queries lentas frecuentes';
    ELSE
        RAISE WARNING '   ⚠️  Rendimiento: % queries lentas detectadas', v_slow_queries;
    END IF;
    
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE '   ℹ️  pg_stat_statements no habilitado - Saltar check de rendimiento';
END $$;

-- 4. VERIFICAR TAMAÑO DE TABLAS
-- =============================================================================
DO $$
DECLARE
    r RECORD;
    v_total_size BIGINT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '4. Verificando tamaño de base de datos...';
    
    FOR r IN
        SELECT 
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 5
    LOOP
        RAISE NOTICE '   📊 %: %', r.tablename, r.size;
        v_total_size := v_total_size + r.bytes;
    END LOOP;
    
    RAISE NOTICE '   Total (top 5): %', pg_size_pretty(v_total_size);
END $$;

-- 5. VERIFICAR USUARIOS ACTIVOS
-- =============================================================================
DO $$
DECLARE
    v_total_users INTEGER;
    v_active_last_week INTEGER;
    v_new_this_week INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '5. Verificando actividad de usuarios...';
    
    -- Total de usuarios
    SELECT COUNT(*) INTO v_total_users
    FROM profiles;
    
    -- Activos en la última semana
    SELECT COUNT(*) INTO v_active_last_week
    FROM profiles
    WHERE updated_at > NOW() - INTERVAL '7 days';
    
    -- Nuevos esta semana
    SELECT COUNT(*) INTO v_new_this_week
    FROM profiles
    WHERE created_at > NOW() - INTERVAL '7 days';
    
    RAISE NOTICE '   👥 Total de usuarios: %', v_total_users;
    RAISE NOTICE '   🔄 Activos (7 días): %', v_active_last_week;
    RAISE NOTICE '   ✨ Nuevos (7 días): %', v_new_this_week;
END $$;

-- 6. VERIFICAR BACKUPS
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '6. Verificando backups...';
    RAISE NOTICE '   ℹ️  Verifica manualmente en Supabase Dashboard → Database → Backups';
    RAISE NOTICE '   ✅ Debe haber al menos 1 backup de los últimos 7 días';
END $$;

-- 7. VERIFICAR FUNCIONES CRÍTICAS
-- =============================================================================
DO $$
DECLARE
    v_function_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '7. Verificando funciones críticas...';
    
    -- Verificar que get_game_ranking existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'get_game_ranking'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '   ✅ get_game_ranking: OK';
    ELSE
        RAISE WARNING '   ❌ get_game_ranking: FALTA - Ranking dinámico no funcionará';
    END IF;
END $$;

-- 8. RESUMEN FINAL
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FIN DEL HEALTH CHECK ===';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACCIONES RECOMENDADAS:';
    RAISE NOTICE '1. Si hay ❌ o ⚠️, investiga y corrige';
    RAISE NOTICE '2. Documenta cualquier problema en docs/INCIDENT_LOG.md';
    RAISE NOTICE '3. Ejecuta este script semanalmente';
    RAISE NOTICE '4. Revisa logs en Supabase Dashboard → Logs';
    RAISE NOTICE '';
END $$;
