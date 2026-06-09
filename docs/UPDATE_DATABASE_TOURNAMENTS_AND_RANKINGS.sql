-- =============================================================================
-- SQL MIGRATION: UPDATE GAME TYPE ENUM AND RANKING FUNCTIONS
-- =============================================================================
-- Ejecuta este script en el editor SQL de tu panel de Supabase para:
-- 1. Agregar 'digimon' y 'flesh_blood' al tipo enum game_type_enum.
-- 2. Actualizar las funciones de ranking para unificar región/ciudad/país.
-- =============================================================================

-- 1. AGREGAR NUEVOS JUEGOS AL ENUM
ALTER TYPE public.game_type_enum ADD VALUE IF NOT EXISTS 'digimon';
ALTER TYPE public.game_type_enum ADD VALUE IF NOT EXISTS 'flesh_blood';

-- 2. RECREAR FUNCIÓN DE RANKING GENERAL CON FILTRO DE REGIÓN UNIFICADO
DROP FUNCTION IF EXISTS public.get_game_ranking(text);

CREATE OR REPLACE FUNCTION public.get_game_ranking(p_game_type TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  region TEXT,
  pwp INT,
  matches_won INT,
  matches_lost INT,
  matches_drew INT,
  team_id UUID,
  team TEXT,
  is_public BOOLEAN,
  is_pro BOOLEAN,
  tournaments_played INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    COALESCE(p.region, p.city, p.country, 'Sin Región') as region,
    COALESCE(p.pwp, 0)::INT as pwp,
    COALESCE(p.matches_won, 0)::INT as matches_won,
    COALESCE(p.matches_lost, 0)::INT as matches_lost,
    COALESCE(p.matches_drew, 0)::INT as matches_drew,
    p.team_id,
    p.team,
    COALESCE(p.is_public, true) as is_public,
    COALESCE(p.is_pro, false) as is_pro,
    -- Contar torneos jugados
    (
      SELECT COUNT(DISTINCT tr.tournament_id)::INT
      FROM tournament_results tr
      JOIN tournaments t ON tr.tournament_id = t.id
      WHERE tr.player_id = p.id
      AND t.game_type::text = p_game_type
    ) as tournaments_played
  FROM profiles p
  WHERE p.game_type::text = p_game_type
  -- FILTRO 1: Solo jugadores que hayan jugado al menos 1 torneo
  AND EXISTS (
    SELECT 1 
    FROM tournament_results tr
    JOIN tournaments t ON tr.tournament_id = t.id
    WHERE tr.player_id = p.id
    AND t.game_type::text = p_game_type
  )
  -- FILTRO 2: Solo jugadores con PWP > 0 (que hayan reclamado puntos)
  AND COALESCE(p.pwp, 0) > 0
  -- FILTRO 3: Solo jugadores REGISTRADOS (username no es un ID genérico)
  AND p.username NOT LIKE 'Jugador #%'
  -- FILTRO 4: Asegurar que tengan email (usuarios reales)
  AND p.email IS NOT NULL
  ORDER BY p.pwp DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_game_ranking(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_game_ranking(text) TO anon;

-- 3. RECREAR FUNCIÓN DE RANKING FILTRADO CON REGIÓN UNIFICADA
DROP FUNCTION IF EXISTS public.get_game_ranking_filtered(text, text, text);

CREATE OR REPLACE FUNCTION public.get_game_ranking_filtered(
    p_game_type  TEXT,
    p_format     TEXT DEFAULT NULL,
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
        COALESCE(p.region, p.city, p.country, 'Sin Región') AS region,
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
        AND tr.claimed = true
        AND EXISTS (
            SELECT 1 FROM player_aliases pa WHERE pa.player_id = p.id
        )
        -- Filtros opcionales
        AND (p_format     IS NULL OR t.format::TEXT      ILIKE p_format)
        AND (p_store_name IS NULL OR t.store_name::TEXT  ILIKE p_store_name)
    GROUP BY p.id
    HAVING
        COALESCE(SUM(tr.pwp_earned), 0) > 0
        AND COUNT(DISTINCT tr.tournament_id) >= 1
    ORDER BY pwp DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_game_ranking_filtered(TEXT, TEXT, TEXT) TO anon, authenticated;

-- 4. RECARGAR CONFIGURACIÓN DE POSTGREST
NOTIFY pgrst, 'reload config';
