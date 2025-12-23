-- =============================================================================
-- FUNCIÓN RPC MEJORADA: Eliminar Torneo (Admin o Dueño)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_tournament_by_id(tournament_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin boolean;
    is_owner boolean;
    deleted_results_count int;
    deleted_tournament boolean;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();

    -- 1. Verificar si el usuario es admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = current_user_id AND role = 'admin'
    ) INTO is_admin;

    -- 2. Verificar si el usuario es el dueño del torneo (organizer_id)
    -- Opcional: También podríamos chequear created_by si organizer_id es NULL
    SELECT EXISTS (
        SELECT 1 FROM public.tournaments
        WHERE id = tournament_id_param AND organizer_id = current_user_id
    ) INTO is_owner;

    -- 3. Validar permisos
    IF is_admin = false AND is_owner = false THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No tienes permisos para eliminar este torneo.'
        );
    END IF;

    -- 4. Verificar que el torneo existe
    IF NOT EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id_param) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El torneo no existe o ya fue eliminado.'
        );
    END IF;

    -- 5. Eliminar los resultados del torneo primero (Clean up)
    DELETE FROM public.tournament_results 
    WHERE tournament_id = tournament_id_param;
    
    GET DIAGNOSTICS deleted_results_count = ROW_COUNT;

    -- 6. Eliminar el torneo
    DELETE FROM public.tournaments 
    WHERE id = tournament_id_param;
    
    GET DIAGNOSTICS deleted_tournament = FOUND;

    IF deleted_tournament THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Torneo eliminado exitosamente',
            'deleted_results', deleted_results_count
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'Error desconocido al eliminar el torneo.'
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION public.delete_tournament_by_id IS 'Permite eliminar un torneo si eres Admin o el Creador (Store) del mismo.';
