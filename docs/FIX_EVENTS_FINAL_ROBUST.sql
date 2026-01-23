-- =============================================================================
-- FIX DEFINITIVO: RPC de Eventos con casting robusto
-- Esto soluciona errores 400 y problemas de conteo de inscritos
-- =============================================================================

-- 1. Eliminar versiones anteriores para evitar conflictos de parámetros
DROP FUNCTION IF EXISTS public.get_scheduled_events_with_registrations(text);
DROP FUNCTION IF EXISTS public.get_scheduled_events_with_registrations(public.game_type_enum);

-- 2. Recrear la función con manejo de tipos robusto
CREATE OR REPLACE FUNCTION public.get_scheduled_events_with_registrations(p_game_type TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    date TEXT,
    store_name TEXT,
    format TEXT,
    registration_count BIGINT,
    created_by UUID,
    max_players INT,
    event_time TEXT,
    is_user_registered BOOLEAN,
    entry_fee TEXT,
    description TEXT,
    game_type TEXT,
    image_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id,
        se.title,
        se.date::TEXT,
        se.store_name,
        se.format,
        (SELECT COUNT(*) FROM public.event_registrations er WHERE er.event_id = se.id AND er.status = 'confirmed')::BIGINT as registration_count,
        se.created_by,
        COALESCE(se.max_players, 64)::INT as max_players,
        COALESCE(se.time::TEXT, '19:00') as event_time,
        EXISTS (
            SELECT 1 FROM public.event_registrations er2
            WHERE er2.event_id = se.id 
            AND er2.player_id = auth.uid()
            AND er2.status = 'confirmed'
        ) as is_user_registered,
        se.entry_fee::TEXT,
        se.description,
        se.game_type::TEXT,
        se.image_url
    FROM public.scheduled_events se
    WHERE se.game_type::TEXT = p_game_type
    ORDER BY se.date ASC, se.time ASC;
END;
$$;

-- 3. Permisos
GRANT EXECUTE ON FUNCTION public.get_scheduled_events_with_registrations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scheduled_events_with_registrations(TEXT) TO anon;

-- Notificar para recargar cache de PostgREST
NOTIFY pgrst, 'reload config';
