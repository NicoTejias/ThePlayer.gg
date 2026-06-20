-- =============================================================================
-- SQL MIGRATION: ADD COMPLETE RANKING RPC (REGISTERED + UNREGISTERED)
-- =============================================================================
-- Ejecuta este script en el editor SQL de tu panel de Supabase.
-- Crea la función get_complete_ranking que agrupa resultados por player_id
-- si está registrado, o por player_name en caso contrario.
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_complete_ranking(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_complete_ranking(TEXT, TEXT[], TEXT);

-- p_formats: lista de formatos de juego a incluir. NULL o vacío = todos.
-- Permite agrupar varios formatos en una sola opción de filtro (ej: "Competitivo").
CREATE OR REPLACE FUNCTION public.get_complete_ranking(
    p_game_type  TEXT,
    p_formats    TEXT[] DEFAULT NULL,
    p_store_name TEXT DEFAULT NULL
)
RETURNS TABLE (
    player_key      TEXT,
    player_name     TEXT,
    username        TEXT,
    region          TEXT,
    is_pro          BOOLEAN,
    is_registered   BOOLEAN,
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
    -- Agrupamos por una clave única por jugador: el player_id si está registrado,
    -- o el player_name en caso contrario. Se calcula por fila en la subconsulta
    -- para luego poder agregar sin que Postgres exija columnas extra en el GROUP BY.
    SELECT
        rows.player_key,
        MAX(rows.player_name)  AS player_name,
        MAX(rows.username)     AS username,
        MAX(rows.region)       AS region,
        bool_or(rows.is_pro)   AS is_pro,
        bool_or(rows.is_registered) AS is_registered,
        SUM(rows.pwp_earned)::BIGINT AS pwp,
        SUM(rows.wins)::BIGINT       AS matches_won,
        SUM(rows.losses)::BIGINT     AS matches_lost,
        SUM(rows.draws)::BIGINT      AS matches_drew,
        COUNT(DISTINCT rows.tournament_id)::BIGINT AS tournaments_played
    FROM (
        SELECT
            COALESCE(tr.player_id::TEXT, tr.player_name) AS player_key,
            COALESCE(p.first_name || ' ' || p.last_name, tr.player_name) AS player_name,
            COALESCE(p.username, '') AS username,
            COALESCE(p.region, p.city, p.country, 'Sin Región') AS region,
            COALESCE(p.is_pro, false) AS is_pro,
            (tr.player_id IS NOT NULL) AS is_registered,
            COALESCE(tr.pwp_earned, 0) AS pwp_earned,
            COALESCE(tr.wins, 0)   AS wins,
            COALESCE(tr.losses, 0) AS losses,
            COALESCE(tr.draws, 0)  AS draws,
            tr.tournament_id
        FROM tournament_results tr
        LEFT JOIN profiles p ON tr.player_id = p.id
        INNER JOIN tournaments t ON tr.tournament_id = t.id
        WHERE
            t.game_type::TEXT = p_game_type
            -- Filtros opcionales
            AND (p_formats    IS NULL OR array_length(p_formats, 1) IS NULL
                 OR t.format::TEXT ILIKE ANY (p_formats))
            AND (p_store_name IS NULL OR t.store_name::TEXT ILIKE p_store_name)
    ) rows
    GROUP BY rows.player_key
    HAVING SUM(rows.pwp_earned) > 0
    ORDER BY pwp DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_complete_ranking(TEXT, TEXT[], TEXT) TO anon, authenticated;

-- Notificar recarga de caché
NOTIFY pgrst, 'reload config';
