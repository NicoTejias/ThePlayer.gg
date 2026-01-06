-- =============================================================================
-- AUDITORÍA RLS SIMPLIFICADA (Compatible con Supabase UI)
-- =============================================================================

-- Ver estado de RLS en todas las tablas
SELECT 
    tablename AS "Tabla",
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado'
        ELSE '❌ SIN RLS'
    END AS "Estado RLS",
    (
        SELECT COUNT(*)
        FROM pg_policies p
        WHERE p.schemaname = 'public'
        AND p.tablename = t.tablename
    ) AS "Políticas"
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.tablename NOT LIKE 'pg_%'
AND t.tablename NOT LIKE 'sql_%'
ORDER BY rowsecurity DESC, tablename;
