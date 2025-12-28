-- =====================================================
-- FIX Y ACTUALIZACIÓN DE POLÍTICAS CMS
-- =====================================================

-- Asegurar que los roles incluyan 'head_judge' para la gestión de contenido
-- Esto soluciona problemas si el usuario es Head Judge pero no Admin en DB

-- 1. Eliminar políticas antiguas para recrearlas limpias
DROP POLICY IF EXISTS "Admins see all articles" ON articles;
DROP POLICY IF EXISTS "Admins can manage articles" ON articles;
DROP POLICY IF EXISTS "Admins can manage videos" ON videos;

-- 2. POLÍTICAS ARTÍCULOS ACTUALIZADAS
-- Lectura Admin: Admins, Organizadores y Head Judges pueden ver borradores
CREATE POLICY "Staff see all articles" ON articles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role IN ('admin', 'organizer', 'head_judge')))
  );

-- Escritura: Admins, Organizadores y Head Judges pueden gestionar
CREATE POLICY "Staff can manage articles" ON articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role IN ('admin', 'organizer', 'head_judge')))
  );

-- 3. POLÍTICAS VIDEOS ACTUALIZADAS
-- Escritura: Admins, Organizadores y Head Judges
CREATE POLICY "Staff can manage videos" ON videos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role IN ('admin', 'organizer', 'head_judge')))
  );

-- 4. GRANT EXTRA (Por seguridad)
GRANT ALL ON articles TO authenticated;
GRANT ALL ON videos TO authenticated;
