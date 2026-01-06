-- =============================================================================
-- AUDITORÍA DE SEGURIDAD - ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Este script verifica el estado de seguridad de todas las tablas
-- y genera un reporte de políticas RLS
-- =============================================================================

-- 1. VERIFICAR QUE RLS ESTÁ HABILITADO EN TODAS LAS TABLAS
-- =============================================================================
DO $$
DECLARE
    r RECORD;
    v_insecure_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '=== AUDITORÍA DE ROW LEVEL SECURITY ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. Verificando tablas sin RLS habilitado...';
    RAISE NOTICE '';
    
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = false
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        v_insecure_tables := array_append(v_insecure_tables, r.tablename);
        RAISE WARNING '⚠️  Tabla SIN RLS: %', r.tablename;
    END LOOP;
    
    IF array_length(v_insecure_tables, 1) IS NULL THEN
        RAISE NOTICE '✅ Todas las tablas tienen RLS habilitado';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ CRÍTICO: % tabla(s) sin RLS', array_length(v_insecure_tables, 1);
        RAISE NOTICE 'Ejecuta: ALTER TABLE <nombre> ENABLE ROW LEVEL SECURITY;';
    END IF;
END $$;

-- 2. LISTAR TODAS LAS POLÍTICAS RLS ACTIVAS
-- =============================================================================
DO $$
DECLARE
    r RECORD;
    v_policy_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '2. Políticas RLS activas:';
    RAISE NOTICE '';
    
    FOR r IN
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    LOOP
        v_policy_count := v_policy_count + 1;
        RAISE NOTICE '📋 Tabla: % | Política: %', r.tablename, r.policyname;
        RAISE NOTICE '   Comando: % | Roles: %', r.cmd, r.roles;
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE 'Total de políticas: %', v_policy_count;
END $$;

-- 3. VERIFICAR TABLAS SIN POLÍTICAS (RLS habilitado pero sin políticas = bloqueo total)
-- =============================================================================
DO $$
DECLARE
    r RECORD;
    v_empty_policies TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '3. Verificando tablas con RLS pero sin políticas...';
    RAISE NOTICE '';
    
    FOR r IN
        SELECT t.tablename
        FROM pg_tables t
        WHERE t.schemaname = 'public'
        AND t.rowsecurity = true
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies p
            WHERE p.schemaname = t.schemaname
            AND p.tablename = t.tablename
        )
    LOOP
        v_empty_policies := array_append(v_empty_policies, r.tablename);
        RAISE WARNING '⚠️  Tabla CON RLS pero SIN políticas (bloqueada): %', r.tablename;
    END LOOP;
    
    IF array_length(v_empty_policies, 1) IS NULL THEN
        RAISE NOTICE '✅ Todas las tablas con RLS tienen políticas definidas';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ ADVERTENCIA: % tabla(s) bloqueadas por falta de políticas', 
                     array_length(v_empty_policies, 1);
    END IF;
END $$;

-- 4. VERIFICAR PERMISOS DE ROLES
-- =============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '4. Permisos de roles en tablas públicas:';
    RAISE NOTICE '';
    
    FOR r IN
        SELECT 
            grantee,
            table_name,
            string_agg(privilege_type, ', ') as privileges
        FROM information_schema.role_table_grants
        WHERE table_schema = 'public'
        AND grantee IN ('anon', 'authenticated', 'service_role')
        GROUP BY grantee, table_name
        ORDER BY table_name, grantee
    LOOP
        RAISE NOTICE '👤 % en % → %', r.grantee, r.table_name, r.privileges;
    END LOOP;
END $$;

-- 5. FUNCIONES CON SECURITY DEFINER (ALTO RIESGO)
-- =============================================================================
DO $$
DECLARE
    r RECORD;
    v_definer_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '5. Funciones con SECURITY DEFINER (revisar cuidadosamente):';
    RAISE NOTICE '';
    
    FOR r IN
        SELECT 
            n.nspname as schema,
            p.proname as function_name,
            pg_get_function_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        ORDER BY p.proname
    LOOP
        v_definer_count := v_definer_count + 1;
        RAISE NOTICE '🔐 %(%) - SECURITY DEFINER', r.function_name, r.arguments;
    END LOOP;
    
    IF v_definer_count = 0 THEN
        RAISE NOTICE '✅ No hay funciones con SECURITY DEFINER';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  % función(es) con privilegios elevados - revisar manualmente', v_definer_count;
    END IF;
END $$;

-- 6. RECOMENDACIONES DE SEGURIDAD
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RECOMENDACIONES ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. Habilita RLS en todas las tablas que contengan datos sensibles';
    RAISE NOTICE '2. Crea políticas específicas para cada rol (anon, authenticated, admin)';
    RAISE NOTICE '3. Usa SECURITY DEFINER solo cuando sea absolutamente necesario';
    RAISE NOTICE '4. Revisa políticas RLS cada vez que agregues una nueva tabla';
    RAISE NOTICE '5. Testea políticas con diferentes roles antes de deploy';
    RAISE NOTICE '6. Documenta el propósito de cada política en comentarios';
    RAISE NOTICE '';
    RAISE NOTICE '=== FIN DE AUDITORÍA ===';
END $$;

-- =============================================================================
-- SCRIPT DE CORRECCIÓN RÁPIDA (Descomenta para aplicar)
-- =============================================================================

/*
-- Habilitar RLS en tablas que lo necesiten
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas si no existen
-- (Ajusta según tus necesidades específicas)

-- Profiles: lectura pública, escritura propia
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
CREATE POLICY "Public profiles viewable" 
ON profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Tournament Results: lectura pública, escritura por tiendas
DROP POLICY IF EXISTS "Anyone can view results" ON tournament_results;
CREATE POLICY "Anyone can view results" 
ON tournament_results FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Stores can insert results" ON tournament_results;
CREATE POLICY "Stores can insert results" 
ON tournament_results FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'store'
    AND status = 'approved'
  )
);

-- Marketplace: CRUD por dueño
DROP POLICY IF EXISTS "Anyone can view listings" ON marketplace_listings;
CREATE POLICY "Anyone can view listings" 
ON marketplace_listings FOR SELECT 
USING (status = 'active');

DROP POLICY IF EXISTS "Users can create listings" ON marketplace_listings;
CREATE POLICY "Users can create listings" 
ON marketplace_listings FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update own listings" ON marketplace_listings;
CREATE POLICY "Users can update own listings" 
ON marketplace_listings FOR UPDATE 
USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can delete own listings" ON marketplace_listings;
CREATE POLICY "Users can delete own listings" 
ON marketplace_listings FOR DELETE 
USING (auth.uid() = seller_id);
*/
