-- Script para resetear la contraseña de Nemesio
-- Opción 1: Enviar email de reset de contraseña (RECOMENDADO)

-- Primero, verificar el usuario de Nemesio
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'norton.thevenin@gmail.com';

-- Opción 2: Si quieres eliminar el usuario y que se registre de nuevo con Google
-- ADVERTENCIA: Esto eliminará todos los datos asociados al usuario

-- PASO 1: Verificar qué datos tiene Nemesio
SELECT 
    p.id,
    p.username,
    p.email,
    p.role,
    p.first_name,
    p.last_name,
    p.pwp,
    p.matches_won,
    p.matches_lost,
    p.judge_status,
    p.judge_role
FROM profiles p
WHERE email = 'norton.thevenin@gmail.com';

-- PASO 2: Guardar datos importantes (ejecutar antes de eliminar)
-- Copia estos valores para restaurarlos después si es necesario
SELECT 
    'Nemesio Thevenin' as nombre_completo,
    pwp,
    matches_won,
    matches_lost,
    matches_drew,
    judge_status,
    judge_role,
    judge_level,
    judge_specialties
FROM profiles
WHERE email = 'norton.thevenin@gmail.com';

-- PASO 3: Eliminar el perfil (esto activará CASCADE y eliminará el usuario de auth.users)
-- SOLO EJECUTAR SI ESTÁS SEGURO
/*
DELETE FROM profiles
WHERE email = 'norton.thevenin@gmail.com';
*/

-- ALTERNATIVA RECOMENDADA: Resetear contraseña desde Supabase Dashboard
-- 1. Ve a Supabase Dashboard > Authentication > Users
-- 2. Busca norton.thevenin@gmail.com
-- 3. Click en los 3 puntos > "Send password reset email"
-- 4. Nemesio recibirá un email para resetear su contraseña

-- NOTA: Si Nemesio quiere usar Google Auth en lugar de email/password:
-- 1. Puede simplemente hacer login con Google usando el mismo email
-- 2. Supabase automáticamente vinculará la cuenta
-- 3. NO necesitas eliminar nada
