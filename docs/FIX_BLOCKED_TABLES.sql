-- =============================================================================
-- CORRECCIÓN DE POLÍTICAS RLS FALTANTES
-- =============================================================================
-- Este script crea políticas para las tablas que están bloqueadas
-- =============================================================================

-- 1. JUDGE_ASSIGNMENTS (actualmente bloqueada)
-- ---------------------------------------------
-- Permite que cualquiera vea las asignaciones de jueces
DROP POLICY IF EXISTS "Anyone can view judge assignments" ON judge_assignments;
CREATE POLICY "Anyone can view judge assignments"
ON judge_assignments FOR SELECT
USING (true);

-- Solo Head Judges y Admins pueden crear asignaciones
DROP POLICY IF EXISTS "Head judges can create assignments" ON judge_assignments;
CREATE POLICY "Head judges can create assignments"
ON judge_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (judge_role = 'head_judge' OR role = 'admin')
  )
);

-- Solo Head Judges y Admins pueden actualizar asignaciones
DROP POLICY IF EXISTS "Head judges can update assignments" ON judge_assignments;
CREATE POLICY "Head judges can update assignments"
ON judge_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (judge_role = 'head_judge' OR role = 'admin')
  )
);

-- Solo Head Judges y Admins pueden eliminar asignaciones
DROP POLICY IF EXISTS "Head judges can delete assignments" ON judge_assignments;
CREATE POLICY "Head judges can delete assignments"
ON judge_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (judge_role = 'head_judge' OR role = 'admin')
  )
);

-- 2. JUDGE_CERTIFICATIONS (actualmente bloqueada)
-- ------------------------------------------------
-- Permite que cualquiera vea las certificaciones
DROP POLICY IF EXISTS "Anyone can view certifications" ON judge_certifications;
CREATE POLICY "Anyone can view certifications"
ON judge_certifications FOR SELECT
USING (true);

-- Solo Head Judges pueden crear certificaciones
DROP POLICY IF EXISTS "Head judges can create certifications" ON judge_certifications;
CREATE POLICY "Head judges can create certifications"
ON judge_certifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND judge_role = 'head_judge'
  )
);

-- Solo Head Judges pueden actualizar certificaciones
DROP POLICY IF EXISTS "Head judges can update certifications" ON judge_certifications;
CREATE POLICY "Head judges can update certifications"
ON judge_certifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND judge_role = 'head_judge'
  )
);

-- Solo Head Judges pueden eliminar certificaciones
DROP POLICY IF EXISTS "Head judges can delete certifications" ON judge_certifications;
CREATE POLICY "Head judges can delete certifications"
ON judge_certifications FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND judge_role = 'head_judge'
  )
);

-- 3. NOTIFICAR CAMBIOS
-- ---------------------
NOTIFY pgrst, 'reload config';

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================
-- Ejecuta esto después para confirmar que se crearon las políticas:
/*
SELECT 
    tablename,
    COUNT(*) as politicas
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('judge_assignments', 'judge_certifications')
GROUP BY tablename;
*/
