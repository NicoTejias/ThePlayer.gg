-- =============================================================================
-- CORE LOGIC UPDATE - ThePlayer.gg
-- Objetivo: Mover la lógica de cálculo de puntos a la base de datos (Single Source of Truth)
-- =============================================================================

-- 1. Función para Recalcular Estadísticas de un Jugador (Privada)
CREATE OR REPLACE FUNCTION public.recalculate_player_stats_internal(target_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_pwp integer;
    total_wins integer;
    total_losses integer;
    total_draws integer;
BEGIN
    -- Calcular totales desde tournament_results
    SELECT 
        COALESCE(SUM(pwp_earned), 0),
        COALESCE(SUM(wins), 0),
        COALESCE(SUM(losses), 0),
        COALESCE(SUM(draws), 0)
    INTO 
        total_pwp,
        total_wins,
        total_losses,
        total_draws
    FROM tournament_results
    WHERE player_id = target_player_id;

    -- Actualizar perfil
    UPDATE profiles
    SET 
        pwp = total_pwp,
        matches_won = total_wins,
        matches_lost = total_losses,
        matches_drew = total_draws
    WHERE id = target_player_id;
END;
$$;

-- 2. Trigger: Actualizar estadísticas al insertar/modificar/borrar resultados
CREATE OR REPLACE FUNCTION public.update_player_stats_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.recalculate_player_stats_internal(OLD.player_id);
    ELSE
        PERFORM public.recalculate_player_stats_internal(NEW.player_id);
    END IF;
    RETURN NULL;
END;
$$;

-- Borrar trigger si existe para recrearlo
DROP TRIGGER IF EXISTS on_tournament_result_change ON public.tournament_results;

CREATE TRIGGER on_tournament_result_change
AFTER INSERT OR UPDATE OR DELETE ON public.tournament_results
FOR EACH ROW
EXECUTE FUNCTION public.update_player_stats_trigger();

-- 3. Función RPC para procesar resultados masivos (Optimizada)
-- Esta función maneja la vinculación inteligente de usuarios
CREATE OR REPLACE FUNCTION public.process_tournament_results_bulk(
    p_tournament_id uuid,
    p_results jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_item jsonb;
    target_player_id uuid;
    found_player_id uuid;
    v_game_type text;
BEGIN
    -- Obtener el tipo de juego del torneo
    SELECT game_type::text INTO v_game_type FROM tournaments WHERE id = p_tournament_id;

    FOR result_item IN SELECT * FROM jsonb_array_elements(p_results)
    LOOP
        -- 1. Intentar encontrar al jugador
        -- a) Por ID directo si viene (ya es un usuario registrado)
        IF (result_item->>'player_id') IS NOT NULL THEN
            target_player_id := (result_item->>'player_id')::uuid;
        ELSE
            -- b) Por coincidencia exacta de nombre en player_aliases (Case Insensitive)
            SELECT player_id INTO found_player_id
            FROM player_aliases
            WHERE alias ILIKE (result_item->>'player_name')
            LIMIT 1;
            
            IF found_player_id IS NOT NULL THEN
                target_player_id := found_player_id;
            ELSE
                -- c) Si no existe, buscamos si hay un perfil con ese username exacto
                SELECT id INTO found_player_id
                FROM profiles
                WHERE username ILIKE (result_item->>'player_name')
                LIMIT 1;

                target_player_id := found_player_id; -- Puede ser NULL, en cuyo caso es un "jugador fantasma" sin ID
            END IF;
        END IF;

        -- 2. Insertar resultado
        INSERT INTO tournament_results (
            tournament_id,
            player_id,
            player_name,
            wins,
            losses,
            draws,
            pwp_earned,
            rank
        )
        VALUES (
            p_tournament_id,
            target_player_id,
            result_item->>'player_name',
            (result_item->>'wins')::int,
            (result_item->>'losses')::int,
            (result_item->>'draws')::int,
            (result_item->>'pwp_earned')::int,
            (result_item->>'rank')::int
        );
        
        -- Nota: El trigger creado arriba se encargará de actualizar los PWP del perfil
        -- automáticamente si target_player_id no es NULL.
    END LOOP;
END;
$$;

-- 4. Función de Mantenimiento: Recalcular TODO (Para corregir inconsistencias actuales)
CREATE OR REPLACE FUNCTION public.maintenance_recalculate_all_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM profiles LOOP
        PERFORM public.recalculate_player_stats_internal(r.id);
    END LOOP;
END;
$$;

-- 5. Asegurar RPCs de Calendario (Inscripciones)
-- Tabla event_registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES public.scheduled_events(id) ON DELETE CASCADE,
    player_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(event_id, player_id)
);

-- Inscribirse
CREATE OR REPLACE FUNCTION public.register_to_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.event_registrations (event_id, player_id)
    VALUES (p_event_id, auth.uid());
END;
$$;

-- Cancelar Inscripción
CREATE OR REPLACE FUNCTION public.cancel_event_registration(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.event_registrations
    WHERE event_id = p_event_id AND player_id = auth.uid();
END;
$$;

-- Obtener eventos con conteo real e indic indicador si estoy inscrito
CREATE OR REPLACE FUNCTION public.get_scheduled_events_with_registrations(p_game_type text)
RETURNS TABLE (
    id uuid,
    title text,
    date text,
    event_time text,
    format text,
    store_name text,
    max_players integer,
    created_by uuid,
    registration_count bigint,
    is_user_registered boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.date,
        e.time,
        e.format,
        e.store_name,
        e.max_players,
        e.created_by,
        (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id) as registration_count,
        (SELECT EXISTS(SELECT 1 FROM event_registrations r WHERE r.event_id = e.id AND r.player_id = auth.uid())) as is_user_registered
    FROM scheduled_events e
    WHERE e.game_type = p_game_type OR p_game_type IS NULL OR e.game_type IS NULL
    ORDER BY e.date ASC;
END;
$$;

-- Ejecutar recálculo inicial para arreglar datos existentes
SELECT public.maintenance_recalculate_all_stats();

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ CORE LOGIC ACTUALIZADA CORRECTAMENTE';
END $$;
