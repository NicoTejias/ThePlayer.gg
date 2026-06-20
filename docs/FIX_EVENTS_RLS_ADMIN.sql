-- =============================================================================
-- FIX: Permitir a los Administradores Actualizar y Eliminar Eventos Agendados
-- Ejecuta este código en el SQL Editor de Supabase
-- =============================================================================

-- 1. Eliminar políticas existentes para evitar duplicados o conflictos
DROP POLICY IF EXISTS "Users can update own events" ON public.scheduled_events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.scheduled_events;

-- 2. Crear política de actualización: Permite al creador (tienda) o a cualquier administrador actualizar
CREATE POLICY "Users and admins can update events" ON public.scheduled_events
    FOR UPDATE
    USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 3. Crear política de eliminación: Permite al creador (tienda) o a cualquier administrador eliminar
CREATE POLICY "Users and admins can delete events" ON public.scheduled_events
    FOR DELETE
    USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 4. Opcional: Asignar eventos antiguos sin created_by al usuario administrador o tienda correspondiente si es necesario
-- (Por seguridad, el RLS de administrador ya les permitirá borrarlos aunque created_by sea NULL)
