-- =============================================================================
-- TABLA: event_registrations
-- Almacena las inscripciones de jugadores a eventos agendados
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.event_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.scheduled_events(id) ON DELETE CASCADE,
    player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    registered_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    UNIQUE(event_id, player_id) -- Un jugador solo puede inscribirse una vez por evento
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_event_registrations_event 
ON public.event_registrations (event_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_player 
ON public.event_registrations (player_id);

-- =============================================================================
-- RLS Policies para event_registrations
-- =============================================================================
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver las inscripciones
CREATE POLICY "Anyone can view registrations" ON public.event_registrations
    FOR SELECT USING (true);

-- Los jugadores pueden inscribirse
CREATE POLICY "Players can register" ON public.event_registrations
    FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Los jugadores pueden cancelar su propia inscripción
CREATE POLICY "Players can cancel own registration" ON public.event_registrations
    FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "Players can delete own registration" ON public.event_registrations
    FOR DELETE USING (auth.uid() = player_id);

-- =============================================================================
-- FUNCIÓN RPC: Inscribirse a un evento
-- =============================================================================
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
    -- Obtener el ID del jugador actual
    v_player_id := auth.uid();
    
    IF v_player_id IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para inscribirte';
    END IF;

    -- Verificar que el evento existe y obtener datos
    SELECT title, max_players INTO v_event_title, v_max_players
    FROM public.scheduled_events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evento no encontrado';
    END IF;

    -- Contar inscripciones actuales
    SELECT COUNT(*) INTO v_current_count
    FROM public.event_registrations
    WHERE event_id = p_event_id AND status = 'confirmed';

    -- Verificar si hay cupo
    IF v_current_count >= v_max_players THEN
        RAISE EXCEPTION 'El evento está lleno';
    END IF;

    -- Verificar si ya está inscrito
    IF EXISTS (
        SELECT 1 FROM public.event_registrations
        WHERE event_id = p_event_id AND player_id = v_player_id
    ) THEN
        RAISE EXCEPTION 'Ya estás inscrito en este evento';
    END IF;

    -- Insertar inscripción
    INSERT INTO public.event_registrations (event_id, player_id)
    VALUES (p_event_id, v_player_id);

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'message', 'Inscripción exitosa',
        'event_title', v_event_title,
        'registered_count', v_current_count + 1,
        'max_players', v_max_players
    );

    RETURN v_result;
END;
$$;

-- =============================================================================
-- COMENTARIOS
-- =============================================================================
COMMENT ON TABLE public.event_registrations IS 'Inscripciones de jugadores a eventos agendados';
COMMENT ON FUNCTION public.register_to_event IS 'Permite a los jugadores inscribirse a un evento';
