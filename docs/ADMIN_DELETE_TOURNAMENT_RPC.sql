-- =============================================================================
-- FUNCIÓN RPC: Eliminar Torneo Duplicado (Admin)
-- =============================================================================

-- Crear función para eliminar torneo (bypassing RLS)
CREATE OR REPLACE FUNCTION public.delete_tournament_by_id(tournament_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin boolean;
    deleted_results_count int;
    deleted_tournament boolean;
BEGIN
    -- Verificar si el usuario es admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO is_admin;

    IF is_admin = false THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Solo los administradores pueden eliminar torneos'
        );
    END IF;

    -- Verificar que el torneo existe
    IF NOT EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id_param) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El torneo no existe'
        );
    END IF;

    -- Eliminar los resultados del torneo
    DELETE FROM public.tournament_results 
    WHERE tournament_id = tournament_id_param;
    
    GET DIAGNOSTICS deleted_results_count = ROW_COUNT;

    -- Eliminar el torneo
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
            'message', 'Error al eliminar el torneo'
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION public.delete_tournament_by_id IS 'Permite a los administradores eliminar un torneo y sus resultados';

-- =============================================================================
-- USO:
-- =============================================================================
-- SELECT public.delete_tournament_by_id('d9b86f80-5d0f-41cd-9b84-46e6056741c2');
