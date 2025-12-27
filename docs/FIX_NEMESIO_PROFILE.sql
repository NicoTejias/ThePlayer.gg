-- Script para arreglar el perfil de Nemesio y diagnosticar el problema general

-- =====================================================================
-- PASO 1: DIAGNÓSTICO - Ver el estado actual de Nemesio
-- =====================================================================
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  role,
  region,
  created_at,
  avatar_url
FROM profiles
WHERE email = 'norton.thevenin@gmail.com';

-- =====================================================================
-- PASO 2: Ver todos los usuarios con username "Jugador"
-- =====================================================================
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM profiles
WHERE username LIKE 'Jugador%'
ORDER BY created_at DESC;

-- =====================================================================
-- PASO 3: SOLUCIÓN - Actualizar el perfil de Nemesio
-- =====================================================================
UPDATE profiles
SET 
  username = 'Nemesio',
  first_name = 'Nemesio',
  last_name = 'Thevenin'
WHERE email = 'norton.thevenin@gmail.com';

-- =====================================================================
-- PASO 4: Verificar que se actualizó correctamente
-- =====================================================================
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  role,
  region
FROM profiles
WHERE email = 'norton.thevenin@gmail.com';

-- =====================================================================
-- PASO 5: SOLUCIÓN GENERAL - Actualizar todos los usuarios "Jugador"
-- que tengan información en first_name o last_name
-- =====================================================================
UPDATE profiles
SET username = CASE
  -- Si tiene first_name y last_name, usar ambos
  WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
    THEN TRIM(first_name || ' ' || last_name)
  -- Si solo tiene first_name, usar solo ese
  WHEN first_name IS NOT NULL 
    THEN first_name
  -- Si solo tiene last_name, usar solo ese
  WHEN last_name IS NOT NULL 
    THEN last_name
  -- Si no tiene ninguno, usar el email antes del @
  ELSE SPLIT_PART(email, '@', 1)
END
WHERE username LIKE 'Jugador%'
  AND username != 'Jugador'; -- No actualizar si el username es exactamente "Jugador" (podría ser intencional)

-- =====================================================================
-- PASO 6: Verificar cuántos usuarios se actualizaron
-- =====================================================================
SELECT 
  COUNT(*) as usuarios_actualizados,
  'Usuarios que ya no tienen username tipo Jugador' as descripcion
FROM profiles
WHERE username NOT LIKE 'Jugador%'
  AND updated_at > NOW() - INTERVAL '1 minute';

-- =====================================================================
-- PASO 7: Ver si quedan usuarios con username "Jugador"
-- =====================================================================
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM profiles
WHERE username LIKE 'Jugador%'
ORDER BY created_at DESC;

-- =====================================================================
-- NOTAS IMPORTANTES:
-- =====================================================================
-- 1. Ejecuta primero los PASOS 1 y 2 para ver el estado actual
-- 2. Luego ejecuta el PASO 3 para arreglar a Nemesio específicamente
-- 3. Verifica con el PASO 4 que se actualizó correctamente
-- 4. Si hay más usuarios afectados, ejecuta el PASO 5
-- 5. Verifica los resultados con los PASOS 6 y 7
-- 
-- IMPORTANTE: Después de ejecutar estos scripts, Nemesio necesitará
-- cerrar sesión y volver a iniciar sesión para ver los cambios reflejados
-- en la interfaz.
