-- =============================================================================
-- FUNCIONES DE INSCRIPCIÓN A EVENTOS - ThePlayer.gg
-- Ejecuta este código en el SQL Editor de Supabase para habilitar inscripciones
-- =============================================================================

-- 1. FUNCIÓN: Inscribirse a un evento
CREATE OR REPLACE FUNCTION public.register_to_event(p_event_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player_id uuid;
    v_event_title text;
    v_max_players integer;
    v_current_count integer;
    v_result json;
BEGIN
    -- Obtener el ID del usuario actual
    v_player_id := auth.uid();
    
    IF v_player_id IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para inscribirte';
    END IF;

    -- Verificar que el evento existe y obtener datos
    SELECT title, COALESCE(max_players, 64) INTO v_event_title, v_max_players
    FROM public.scheduled_events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evento no encontrado';
    END IF;

    -- Contar inscripciones actuales
    SELECT COUNT(*) INTO v_current_count
    FROM public.event_registrations
    WHERE event_id = p_event_id AND status = 'confirmed';

    -- Verificar si ya está inscrito (podría estar como 'cancelled' antes)
    IF EXISTS (
        SELECT 1 FROM public.event_registrations
        WHERE event_id = p_event_id AND player_id = v_player_id AND status = 'confirmed'
    ) THEN
        RAISE EXCEPTION 'Ya estás inscrito en este evento';
    END IF;

    -- Si existía una cancelación previa, la reactivamos. Si no, insertamos.
    INSERT INTO public.event_registrations (event_id, player_id, status)
    VALUES (p_event_id, v_player_id, 'confirmed')
    ON CONFLICT (event_id, player_id) 
    DO UPDATE SET status = 'confirmed', registered_at = now();

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'message', 'Inscripción exitosa',
        'event_title', v_event_title
    );

    RETURN v_result;
END;
$$;

-- 2. FUNCIÓN: Cancelar inscripción
CREATE OR REPLACE FUNCTION public.cancel_event_registration(p_event_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player_id uuid;
BEGIN
    v_player_id := auth.uid();
    
    IF v_player_id IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión';
    END IF;

    -- Borrar la inscripción directamente (o cambiar estado a 'cancelled')
    -- Elegimos borrarla para simplificar la lógica de reactivación
    DELETE FROM public.event_registrations
    WHERE event_id = p_event_id AND player_id = v_player_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Inscripción cancelada'
    );
END;
$$;

-- 3. PERMISOS
GRANT EXECUTE ON FUNCTION public.register_to_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_event_registration(uuid) TO authenticated;
