-- =============================================================================
-- FUNCIÓN RPC: Cancelar inscripción a un evento
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cancel_event_registration(p_event_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player_id uuid;
    v_event_title text;
    v_result json;
BEGIN
    -- Obtener el ID del jugador actual
    v_player_id := auth.uid();
    
    IF v_player_id IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión';
    END IF;

    -- Verificar que el evento existe
    SELECT title INTO v_event_title
    FROM public.scheduled_events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evento no encontrado';
    END IF;

    -- Verificar que está inscrito
    IF NOT EXISTS (
        SELECT 1 FROM public.event_registrations
        WHERE event_id = p_event_id AND player_id = v_player_id
    ) THEN
        RAISE EXCEPTION 'No estás inscrito en este evento';
    END IF;

    -- Eliminar la inscripción
    DELETE FROM public.event_registrations
    WHERE event_id = p_event_id AND player_id = v_player_id;

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'message', 'Inscripción cancelada',
        'event_title', v_event_title
    );

    RETURN v_result;
END;
$$;

-- =============================================================================
-- FUNCIÓN RPC: Verificar si el usuario está inscrito en un evento
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_user_registered(p_event_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.event_registrations
        WHERE event_id = p_event_id 
        AND player_id = p_user_id 
        AND status = 'confirmed'
    );
$$;

COMMENT ON FUNCTION public.cancel_event_registration IS 'Permite a los jugadores cancelar su inscripción a un evento';
COMMENT ON FUNCTION public.is_user_registered IS 'Verifica si un usuario está inscrito en un evento';
