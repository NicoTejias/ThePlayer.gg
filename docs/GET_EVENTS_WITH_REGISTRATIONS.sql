-- =============================================================================
-- FUNCIÓN RPC: Obtener eventos agendados con contador de inscritos
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_scheduled_events_with_registrations()
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
    registration_count bigint
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
        COALESCE(COUNT(er.id), 0) as registration_count
    FROM public.scheduled_events se
    LEFT JOIN public.event_registrations er 
        ON se.id = er.event_id AND er.status = 'confirmed'
    WHERE se.date >= CURRENT_DATE
    GROUP BY se.id, se.title, se.date, se.time, se.format, se.store_name, 
             se.max_players, se.description, se.created_by, se.created_at
    ORDER BY se.date ASC, se.time ASC;
$$;

COMMENT ON FUNCTION public.get_scheduled_events_with_registrations IS 'Devuelve eventos agendados con el contador de inscripciones confirmadas';
