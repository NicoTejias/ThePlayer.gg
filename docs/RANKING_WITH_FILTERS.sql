-- =============================================================================
-- RANKING FILTRADO POR FORMATO, TIENDA Y JUEGO
-- =============================================================================
-- Crea la función get_game_ranking_filtered que acepta filtros opcionales
-- de formato y nombre de tienda, además del tipo de juego.
-- Úsala cuando el usuario filtra el ranking por formato o tienda.
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_game_ranking_filtered(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_game_ranking_filtered(TEXT, TEXT[], TEXT);

-- p_formats: lista de formatos de juego a incluir. NULL o vacío = todos.
CREATE OR REPLACE FUNCTION public.get_game_ranking_filtered(
    p_game_type  TEXT,
    p_formats    TEXT[] DEFAULT NULL,
    p_store_name TEXT DEFAULT NULL
)
RETURNS TABLE (
    id              UUID,
    username        TEXT,
    first_name      TEXT,
    last_name       TEXT,
    region          TEXT,
    team            TEXT,
    team_id         UUID,
    is_public       BOOLEAN,
    is_pro          BOOLEAN,
    pwp             BIGINT,
    matches_won     BIGINT,
    matches_lost    BIGINT,
    matches_drew    BIGINT,
    tournaments_played BIGINT
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
        COALESCE(SUM(tr.pwp_earned), 0)::BIGINT     AS pwp,
        COALESCE(SUM(tr.wins), 0)::BIGINT           AS matches_won,
        COALESCE(SUM(tr.losses), 0)::BIGINT         AS matches_lost,
        COALESCE(SUM(tr.draws), 0)::BIGINT          AS matches_drew,
        COUNT(DISTINCT tr.tournament_id)::BIGINT    AS tournaments_played
    FROM profiles p
    INNER JOIN tournament_results tr ON p.id = tr.player_id
    INNER JOIN tournaments t         ON tr.tournament_id = t.id
    WHERE
        t.game_type::TEXT = p_game_type
        AND tr.player_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM player_aliases pa WHERE pa.player_id = p.id
        )
        -- Filtros opcionales
        AND (p_formats    IS NULL OR array_length(p_formats, 1) IS NULL
             OR t.format::TEXT ILIKE ANY (p_formats))
        AND (p_store_name IS NULL OR t.store_name::TEXT  ILIKE p_store_name)
    GROUP BY p.id
    HAVING
        COALESCE(SUM(tr.pwp_earned), 0) > 0
        AND COUNT(DISTINCT tr.tournament_id) >= 1
    ORDER BY pwp DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_game_ranking_filtered(TEXT, TEXT[], TEXT) TO anon, authenticated;

-- =============================================================================
-- FUNCIÓN AUXILIAR: listar formatos y tiendas disponibles para un juego
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_tournament_filter_options(TEXT);

CREATE OR REPLACE FUNCTION public.get_tournament_filter_options(p_game_type TEXT)
RETURNS TABLE (
    formats     TEXT[],
    store_names TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ARRAY(
            SELECT DISTINCT t.format::TEXT
            FROM tournaments t
            WHERE t.game_type::TEXT = p_game_type
              AND t.format IS NOT NULL
            ORDER BY 1
        ) AS formats,
        ARRAY(
            SELECT DISTINCT t.store_name::TEXT
            FROM tournaments t
            WHERE t.game_type::TEXT = p_game_type
              AND t.store_name IS NOT NULL
            ORDER BY 1
        ) AS store_names;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tournament_filter_options(TEXT) TO anon, authenticated;
