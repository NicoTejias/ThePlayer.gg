-- =============================================================================
-- AUDITORÍA RLS — REPORTE EN TABLAS (copiar/pegar resultados)
-- =============================================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar TODO → Run
-- Cada bloque numerado devuelve una tabla. Copia los resultados y compártelos.
-- Es SOLO LECTURA: no modifica nada.
-- =============================================================================

-- (1) TABLAS SIN RLS HABILITADO  (cualquier fila aquí = riesgo)
SELECT '1_TABLAS_SIN_RLS' AS reporte, tablename
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;

-- (2) TABLAS CON RLS PERO SIN NINGUNA POLÍTICA (quedan bloqueadas o dependen de grants)
SELECT '2_RLS_SIN_POLITICAS' AS reporte, t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public' AND t.rowsecurity = true
AND NOT EXISTS (
  SELECT 1 FROM pg_policies p
  WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
)
ORDER BY t.tablename;

-- (3) ¿auth.users EXPUESTO A anon/authenticated/public?  (CRÍTICO si devuelve filas)
SELECT '3_AUTH_USERS_EXPUESTO' AS reporte, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'auth' AND table_name = 'users'
AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY grantee;

-- (4) TODAS LAS POLÍTICAS RLS (revisar las de UPDATE/DELETE/INSERT y las de admin)
SELECT '4_POLITICAS' AS reporte, tablename, policyname, cmd, roles::text,
       qual AS using_expr, with_check AS check_expr
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- (5) FUNCIONES SECURITY DEFINER (privilegios elevados — deben validar rol internamente)
SELECT '5_SECURITY_DEFINER' AS reporte, p.proname AS funcion,
       pg_get_function_arguments(p.oid) AS argumentos
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prosecdef = true
ORDER BY p.proname;

-- (6) GRANTS AMPLIOS A anon (escritura para no autenticados = peligroso)
SELECT '6_ANON_ESCRITURA' AS reporte, table_name,
       string_agg(privilege_type, ', ') AS permisos
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee = 'anon'
AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
GROUP BY table_name
ORDER BY table_name;
