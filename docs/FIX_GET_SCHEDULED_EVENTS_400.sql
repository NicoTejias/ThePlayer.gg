-- =============================================================================
-- FIX: error 400 en get_scheduled_events_with_registrations
-- =============================================================================
-- CAUSA: la función declaraba entry_fee como `numeric`, pero la columna real
-- scheduled_events.entry_fee es `text`. Postgres aborta con:
--   "structure of query does not match function result type ... column 10"
-- y PostgREST lo devuelve como HTTP 400. Por eso el frontend caía siempre al
-- fallback (consultas extra + ruido en consola).
--
-- SOLUCIÓN: declarar entry_fee como text (coincide con la tabla).
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar TODO -> Run. Idempotente.
-- =============================================================================

-- Cambia el tipo de retorno (entry_fee numeric->text), así que hay que borrar
-- la función antes de recrearla (Postgres no permite REPLACE con otro RETURNS).
DROP FUNCTION IF EXISTS public.get_scheduled_events_with_registrations(text);

CREATE OR REPLACE FUNCTION public.get_scheduled_events_with_registrations(p_game_type text)
RETURNS TABLE(
    id uuid,
    title text,
    date date,
    event_time text,
    format text,
    store_name text,
    max_players integer,
    description text,
    game_type text,
    entry_fee text,          -- <-- antes numeric; ahora text (coincide con la columna)
    created_by uuid,
    created_at timestamp with time zone,
    registration_count bigint,
    is_user_registered boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        se.id,
        se.title,
        se.date,
        se.time::TEXT AS event_time,
        se.format,
        se.store_name,
        se.max_players,
        se.description,
        se.game_type::TEXT,
        se.entry_fee,
        se.created_by,
        se.created_at,
        COUNT(er.id)::BIGINT AS registration_count,
        EXISTS (
            SELECT 1 FROM event_registrations er2
            WHERE er2.event_id = se.id AND er2.player_id = auth.uid()
        ) AS is_user_registered
    FROM scheduled_events se
    LEFT JOIN event_registrations er ON se.id = er.event_id
    WHERE se.game_type::TEXT = p_game_type
    GROUP BY se.id;
END;
$function$;

NOTIFY pgrst, 'reload config';
