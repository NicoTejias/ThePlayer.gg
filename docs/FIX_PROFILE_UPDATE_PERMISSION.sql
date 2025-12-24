-- =============================================================================
-- FIX: Permission Denied for Table Users (Profile Update Error)
-- =============================================================================
-- PROBLEMA: La política RLS "Admins can update any profile" intenta leer
-- auth.users.email para verificar si el usuario es admin, pero el rol 'public'
-- no tiene permisos de SELECT en auth.users.
--
-- SOLUCIÓN: Otorgar permisos de SELECT en auth.users para roles autenticados
-- (esto es seguro ya que solo expone datos del propio usuario autenticado)
-- =============================================================================

-- Opción 1: Otorgar SELECT en auth.users (RECOMENDADO)
-- Esto permite que las políticas RLS lean información del usuario autenticado
GRANT USAGE ON SCHEMA auth TO public;
GRANT SELECT ON auth.users TO public;

-- Opción 2 (Alternativa): Refactorizar la política para usar profiles.email
-- Si prefieres no exponer auth.users, puedes cambiar la política así:
/*
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE
    USING (
        (SELECT email FROM public.profiles WHERE id = auth.uid())::text 
        = ANY (ARRAY['nicotejias@gmail.com', 'nicolas.tejias@gmail.com', 'hugocastro.arts@gmail.com']::text[])
    );
*/

-- Recargar la configuración de PostgREST para aplicar cambios
NOTIFY pgrst, 'reload config';
