-- Script final para arreglar el perfil de Nemesio (norton.thevenin@gmail.com)
-- Problema: username es "Neme B." pero first_name y last_name son NULL

-- =====================================================================
-- PASO 1: Ver el estado actual
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
WHERE email = 'norton.thevenin@gmail.com';

-- =====================================================================
-- PASO 2: Actualizar el perfil de Nemesio con datos completos
-- =====================================================================
-- Opción A: Si quieres que aparezca como "Nemesio Thevenin"
UPDATE profiles
SET 
  username = 'Nemesio Thevenin',
  first_name = 'Nemesio',
  last_name = 'Thevenin'
WHERE email = 'norton.thevenin@gmail.com';

-- Opción B: Si quieres que aparezca solo como "Nemesio"
-- UPDATE profiles
-- SET 
--   username = 'Nemesio',
--   first_name = 'Nemesio',
--   last_name = ''
-- WHERE email = 'norton.thevenin@gmail.com';

-- =====================================================================
-- PASO 3: Verificar la actualización
-- =====================================================================
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  role
FROM profiles
WHERE email = 'norton.thevenin@gmail.com';

-- =====================================================================
-- PASO 4: Arreglar otros usuarios con first_name o last_name NULL
-- =====================================================================
-- Este paso es opcional, solo si quieres arreglar todos los usuarios
-- que tienen username pero les faltan first_name o last_name

UPDATE profiles
SET 
  first_name = CASE 
    WHEN first_name IS NULL OR first_name = '' 
    THEN SPLIT_PART(username, ' ', 1)
    ELSE first_name
  END,
  last_name = CASE 
    WHEN last_name IS NULL OR last_name = ''
    THEN NULLIF(TRIM(SUBSTRING(username FROM POSITION(' ' IN username))), '')
    ELSE last_name
  END
WHERE (first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '')
  AND username IS NOT NULL
  AND username != '';

-- =====================================================================
-- PASO 5: Verificar todos los usuarios actualizados
-- =====================================================================
SELECT 
  username,
  email,
  first_name,
  last_name,
  role
FROM profiles
WHERE updated_at > NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC;

-- =====================================================================
-- NOTAS IMPORTANTES:
-- =====================================================================
-- 1. Ejecuta PASO 1 para ver el estado actual
-- 2. Ejecuta PASO 2 (Opción A o B según prefieras)
-- 3. Ejecuta PASO 3 para verificar
-- 4. (Opcional) Ejecuta PASO 4 para arreglar otros usuarios
-- 5. Verifica con PASO 5
--
-- Después de ejecutar, Nemesio debe:
-- 1. Cerrar sesión
-- 2. Volver a iniciar sesión
-- 3. El cambio se verá reflejado inmediatamente
