-- =============================================================================
-- FIX PWP CALCULATION BY GAME
-- =============================================================================

-- Problema: Los perfiles tienen un solo campo 'pwp' (global), pero ahora tenemos múltiples juegos.
-- Si hay torneos de MTG y Pokemon, se están sumando en la misma columna.

-- Como solución rápida para que el ranking visual funcione, vamos a crear una función RPC
-- que devuelve el ranking calculado al vuelo según el juego seleccionado, en lugar de confiar
-- en la columna estática 'pwp' de profiles.

CREATE OR REPLACE FUNCTION public.get_game_ranking(p_game_type TEXT)
RETURNS TABLE (
    id UUID,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    region TEXT,
    team TEXT,
    team_id UUID,
    is_public BOOLEAN,
    is_pro BOOLEAN,
    pwp BIGINT,          -- Calculado al vuelo
    matches_won BIGINT,    -- Calculado al vuelo
    matches_lost BIGINT,   -- Calculado al vuelo
    matches_drew BIGINT    -- Calculado al vuelo
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.first_name,
        p.last_name,
        p.region,
        p.team,
        p.team_id,
        p.is_public,
        p.is_pro,
        COALESCE(SUM(tr.pwp_earned), 0) as pwp,
        COALESCE(SUM(tr.wins), 0) as matches_won,
        COALESCE(SUM(tr.losses), 0) as matches_lost,
        COALESCE(SUM(tr.draws), 0) as matches_drew
    FROM profiles p
    LEFT JOIN tournament_results tr ON p.id = tr.player_id
    LEFT JOIN tournaments t ON tr.tournament_id = t.id
    WHERE t.game_type = p_game_type  -- Filtrar SOLO por el juego actual
    GROUP BY p.id
    HAVING COALESCE(SUM(tr.pwp_earned), 0) > 0  -- Opcional: mostrar solo jugadores con puntos
    ORDER BY pwp DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_game_ranking(TEXT) TO anon, authenticated;
