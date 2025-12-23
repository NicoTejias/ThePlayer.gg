-- =============================================================================
-- FUNCIÓN RPC: Obtener eventos agendados con contador de inscritos
-- SIN filtro de fecha (el frontend se encarga del filtrado)
-- =============================================================================

-- Eliminar la función anterior si existe
DROP FUNCTION IF EXISTS public.get_scheduled_events_with_registrations();

-- Crear la nueva versión SIN filtro de fecha
CREATE FUNCTION public.get_scheduled_events_with_registrations()
RETURNS TABLE (
    id uuid,
    title text,
    date date,
    event_time text,
    format text,
    store_name text,
    max_players integer,
    description text,
    created_by uuid,
    created_at timestamp with time zone,
    registration_count bigint,
    is_user_registered boolean
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        se.id,
        se.title,
        se.date,
        se.time::text as event_time,
        se.format,
        se.store_name,
        se.max_players,
        se.description,
        se.created_by,
        se.created_at,
        COALESCE(COUNT(er.id), 0) as registration_count,
        EXISTS (
            SELECT 1 FROM public.event_registrations er2
            WHERE er2.event_id = se.id 
            AND er2.player_id = auth.uid()
            AND er2.status = 'confirmed'
        ) as is_user_registered
    FROM public.scheduled_events se
    LEFT JOIN public.event_registrations er 
        ON se.id = er.event_id AND er.status = 'confirmed'
    GROUP BY se.id, se.title, se.date, se.time, se.format, se.store_name, 
             se.max_players, se.description, se.created_by, se.created_at
    ORDER BY se.date ASC, se.time ASC;
$$;

COMMENT ON FUNCTION public.get_scheduled_events_with_registrations IS 'Devuelve TODOS los eventos agendados con el contador de inscripciones. El filtrado por fecha se hace en el frontend.';
