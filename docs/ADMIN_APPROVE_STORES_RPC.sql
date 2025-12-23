-- =============================================================================
-- FUNCIÓN RPC: Aprobar/Rechazar Tiendas (Solo Admins)
-- =============================================================================

-- Función para aprobar una tienda
CREATE OR REPLACE FUNCTION public.approve_store(store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin boolean;
BEGIN
    -- Verificar que el usuario actual es admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Solo los administradores pueden aprobar tiendas';
    END IF;

    -- Actualizar el status de la tienda
    UPDATE public.profiles
    SET status = 'active'
    WHERE id = store_id AND role = 'store';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tienda no encontrada';
    END IF;
END;
$$;

-- Función para rechazar una tienda
CREATE OR REPLACE FUNCTION public.reject_store(store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin boolean;
BEGIN
    -- Verificar que el usuario actual es admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Solo los administradores pueden rechazar tiendas';
    END IF;

    -- Actualizar el status de la tienda
    UPDATE public.profiles
    SET status = 'rejected'
    WHERE id = store_id AND role = 'store';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tienda no encontrada';
    END IF;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION public.approve_store IS 'Permite a los admins aprobar tiendas pendientes';
COMMENT ON FUNCTION public.reject_store IS 'Permite a los admins rechazar tiendas pendientes';
