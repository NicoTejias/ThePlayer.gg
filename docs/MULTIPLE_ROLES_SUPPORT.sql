-- =====================================================
-- SOPORTE PARA MÚLTIPLES ROLES POR USUARIO
-- =====================================================

-- 1. Agregar flags para roles adicionales
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_judge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_content_creator BOOLEAN DEFAULT false;

-- 2. Actualizar is_content_creator basado en el role actual para no perder data
UPDATE profiles 
SET is_content_creator = true 
WHERE role = 'content_creator';

-- 3. Actualizar is_judge basado en el role actual
UPDATE profiles 
SET is_judge = true 
WHERE role = 'judge';

-- Nota: El campo 'role' se mantendrá como el rol "principal" o "base" (jugador, tienda, admin),
-- pero los flags permitirán que un jugador sea también juez y creador al mismo tiempo.
