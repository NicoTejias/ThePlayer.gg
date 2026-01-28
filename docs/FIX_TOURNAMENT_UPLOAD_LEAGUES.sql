-- =============================================================================
-- FIX TOURNAMENT RPC WITH LEAGUE SUPPORT
-- =============================================================================
-- Este script actualiza la función RPC para que acepte 'league_id' y 'game_type'
-- =============================================================================

-- 1. Eliminar versiones anteriores para evitar conflictos de firma
DROP FUNCTION IF EXISTS public.create_tournament_via_rpc(uuid, text, date, text, text, integer);
DROP FUNCTION IF EXISTS public.create_tournament_via_rpc(uuid, text, date, text, text, integer, public.game_type_enum);

-- 2. Crear nueva versión con todos los parámetros necesarios
CREATE OR REPLACE FUNCTION public.create_tournament_via_rpc(
    p_id uuid,
    p_name text,
    p_date date,
    p_store_name text,
    p_format text,
    p_player_count integer,
    p_game_type public.game_type_enum DEFAULT 'mtg',
    p_league_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Obtener el ID del usuario actual (la tienda)
    v_user_id := auth.uid();

    INSERT INTO public.tournaments (
        id, 
        name, 
        date, 
        store_name, 
        format, 
        player_count, 
        game_type,
        league_id,
        organizer_id,
        created_at
    )
    VALUES (
        p_id, 
        p_name, 
        p_date, 
        p_store_name, 
        p_format, 
        p_player_count, 
        p_game_type,
        p_league_id,
        v_user_id,
        now()
    );
END;
$$;

-- 3. Asignar Permisos
GRANT EXECUTE ON FUNCTION public.create_tournament_via_rpc(uuid, text, date, text, text, integer, public.game_type_enum, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tournament_via_rpc(uuid, text, date, text, text, integer, public.game_type_enum, uuid) TO service_role;

-- 4. Notificar recargo
NOTIFY pgrst, 'reload config';
