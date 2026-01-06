-- =============================================================================
-- UPDATE RANKING FILTERS V2 - ThePlayer.gg
-- Solo muestra jugadores REGISTRADOS con puntos
-- =============================================================================

-- 1. ACTUALIZAR get_game_ranking para filtrar jugadores no registrados
DROP FUNCTION IF EXISTS get_game_ranking(text);

CREATE OR REPLACE FUNCTION get_game_ranking(p_game_type TEXT)
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
    COALESCE(p.region, 'Sin Región') as region,
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
  -- Los IDs genéricos tienen el formato "Jugador #XXXX"
  AND p.username NOT LIKE 'Jugador #%'
  -- FILTRO 4: Asegurar que tengan email (usuarios reales)
  AND p.email IS NOT NULL
  ORDER BY p.pwp DESC NULLS LAST;
END;
$$;

-- 2. OTORGAR PERMISOS
GRANT EXECUTE ON FUNCTION get_game_ranking(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_game_ranking(text) TO anon;

-- 3. VERIFICAR FUNCIONAMIENTO
DO $$
DECLARE
  test_result RECORD;
  result_count INT := 0;
  generic_count INT := 0;
BEGIN
  RAISE NOTICE '=== PROBANDO get_game_ranking CON FILTROS ACTUALIZADOS ===';
  
  -- Contar jugadores genéricos que serán excluidos
  SELECT COUNT(*) INTO generic_count
  FROM profiles
  WHERE username LIKE 'Jugador #%'
  AND pwp > 0;
  
  RAISE NOTICE 'Jugadores genéricos excluidos: %', generic_count;
  
  -- Mostrar top 10 jugadores registrados
  FOR test_result IN 
    SELECT * FROM get_game_ranking('mtg') LIMIT 10
  LOOP
    result_count := result_count + 1;
    RAISE NOTICE '#%: % - PWP: % | Torneos: %', 
      result_count, 
      test_result.username, 
      test_result.pwp,
      test_result.tournaments_played;
  END LOOP;
  
  IF result_count = 0 THEN
    RAISE NOTICE '⚠️ No se encontraron jugadores registrados que cumplan los filtros';
  ELSE
    RAISE NOTICE '✅ Función actualizada correctamente. % jugadores registrados encontrados', result_count;
  END IF;
END $$;
