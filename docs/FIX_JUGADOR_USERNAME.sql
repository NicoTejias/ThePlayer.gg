-- Script para diagnosticar y arreglar el problema de usuarios que aparecen como "Jugador"
-- Este problema ocurre cuando el perfil se crea sin un username válido

-- 1. Primero, veamos todos los perfiles que tienen "Jugador" como username
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

-- 2. Verificar si hay un trigger o función que esté sobrescribiendo el username
-- (Ejecutar en la consola de Supabase para ver triggers)
-- SELECT * FROM pg_trigger WHERE tgname LIKE '%profile%';

-- 3. SOLUCIÓN TEMPORAL: Actualizar manualmente el username de Nemesio
-- Reemplaza 'nemesio@email.com' con el email real de Nemesio
UPDATE profiles
SET username = COALESCE(
  NULLIF(TRIM(first_name || ' ' || last_name), ''),
  SPLIT_PART(email, '@', 1)
)
WHERE email = 'nemesio@email.com' -- REEMPLAZAR CON EL EMAIL REAL
  AND username = 'Jugador';

-- 4. SOLUCIÓN GENERAL: Actualizar todos los usuarios con username "Jugador"
-- para que usen su nombre completo o email
UPDATE profiles
SET username = COALESCE(
  NULLIF(TRIM(first_name || ' ' || last_name), ''),
  SPLIT_PART(email, '@', 1),
  'Usuario_' || SUBSTRING(id::text FROM 1 FOR 8)
)
WHERE username LIKE 'Jugador%'
  AND (first_name IS NOT NULL OR last_name IS NOT NULL OR email IS NOT NULL);

-- 5. Verificar que se actualizó correctamente
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  role
FROM profiles
WHERE username NOT LIKE 'Jugador%'
  AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
