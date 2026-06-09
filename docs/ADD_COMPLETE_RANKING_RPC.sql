-- =============================================================================
-- SQL MIGRATION: ADD COMPLETE RANKING RPC (REGISTERED + UNREGISTERED)
-- =============================================================================
-- Ejecuta este script en el editor SQL de tu panel de Supabase.
-- Crea la función get_complete_ranking que agrupa resultados por player_id
-- si está registrado, o por player_name en caso contrario.
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_complete_ranking(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_complete_ranking(
    p_game_type  TEXT,
    p_format     TEXT DEFAULT NULL,
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
    SELECT
        COALESCE(tr.player_id::TEXT, tr.player_name) AS player_key,
        COALESCE(p.first_name || ' ' || p.last_name, tr.player_name) AS player_name,
        COALESCE(p.username, '') AS username,
        COALESCE(p.region, p.city, p.country, 'Sin Región') AS region,
        COALESCE(p.is_pro, false) AS is_pro,
        (tr.player_id IS NOT NULL) AS is_registered,
        COALESCE(SUM(tr.pwp_earned), 0)::BIGINT AS pwp,
        COALESCE(SUM(tr.wins), 0)::BIGINT AS matches_won,
        COALESCE(SUM(tr.losses), 0)::BIGINT AS matches_lost,
        COALESCE(SUM(tr.draws), 0)::BIGINT AS matches_drew,
        COUNT(DISTINCT tr.tournament_id)::BIGINT AS tournaments_played
    FROM tournament_results tr
    LEFT JOIN profiles p ON tr.player_id = p.id
    INNER JOIN tournaments t ON tr.tournament_id = t.id
    WHERE
        t.game_type::TEXT = p_game_type
        -- Filtros opcionales
        AND (p_format     IS NULL OR t.format::TEXT     ILIKE p_format)
        AND (p_store_name IS NULL OR t.store_name::TEXT ILIKE p_store_name)
    GROUP BY 
        COALESCE(tr.player_id::TEXT, tr.player_name),
        tr.player_id,
        p.first_name,
        p.last_name,
        p.username,
        p.region,
        p.city,
        p.country,
        p.is_pro
    HAVING
        COALESCE(SUM(tr.pwp_earned), 0) > 0
    ORDER BY pwp DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_complete_ranking(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Notificar recarga de caché
NOTIFY pgrst, 'reload config';
