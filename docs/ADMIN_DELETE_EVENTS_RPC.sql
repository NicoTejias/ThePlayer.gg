-- =============================================================================
-- FUNCIÓN RPC: Eliminar Todos los Eventos (Solo Admins)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_all_scheduled_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin boolean;
    deleted_count integer;
BEGIN
    -- Verificar que el usuario actual es admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO is_admin;

    IF is_admin = false THEN
        RAISE EXCEPTION 'Solo los administradores pueden eliminar todos los eventos';
    END IF;

    -- Eliminar todos los eventos y contar cuántos se eliminaron
    DELETE FROM public.scheduled_events;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

-- Función para eliminar eventos duplicados
CREATE OR REPLACE FUNCTION public.delete_duplicate_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin boolean;
    deleted_count integer;
BEGIN
    -- Verificar que el usuario actual es admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO is_admin;

    IF is_admin = false THEN
        RAISE EXCEPTION 'Solo los administradores pueden eliminar eventos duplicados';
    END IF;

    -- Eliminar duplicados (mantiene solo el primero de cada grupo)
    DELETE FROM public.scheduled_events
    WHERE id NOT IN (
        SELECT MIN(id)
        FROM public.scheduled_events
        GROUP BY title, date, time, store_name
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION public.delete_all_scheduled_events IS 'Permite a los admins eliminar todos los eventos agendados';
COMMENT ON FUNCTION public.delete_duplicate_events IS 'Permite a los admins eliminar eventos duplicados';
