-- =============================================================================
-- UPDATE RPC FOR MULTI-GAME SUPPORT
-- =============================================================================
-- Este script actualiza la función RPC para que acepte 'game_type'
-- =============================================================================

-- 1. Eliminar la versión anterior (firma antigua)
DROP FUNCTION IF EXISTS public.create_tournament_via_rpc(uuid, text, date, text, text, integer);

-- 2. Crear nueva versión con parametro p_game_type
CREATE OR REPLACE FUNCTION public.create_tournament_via_rpc(
    p_id uuid,
    p_name text,
    p_date date,
    p_store_name text,
    p_format text,
    p_player_count integer,
    p_game_type public.game_type_enum DEFAULT 'mtg' -- Nuevo parámetro
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.tournaments (
        id, 
        name, 
        date, 
        store_name, 
        format, 
        player_count, 
        game_type, -- Nueva columna
        created_at
    )
    VALUES (
        p_id, 
        p_name, 
        p_date, 
        p_store_name, 
        p_format, 
        p_player_count, 
        p_game_type, -- Nuevo valor
        now()
    );
END;
$$;

-- 3. Asignar Permisos (Importante)
GRANT EXECUTE ON FUNCTION public.create_tournament_via_rpc(uuid, text, date, text, text, integer, public.game_type_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tournament_via_rpc(uuid, text, date, text, text, integer, public.game_type_enum) TO service_role;

-- 4. Notificar recargo
NOTIFY pgrst, 'reload config';
