-- =============================================================================
-- FIX COMPLETE RPC FUNCTIONS - ThePlayer.gg
-- Este script elimina y recrea todas las funciones RPC necesarias
-- =============================================================================

-- 1. ELIMINAR TODAS LAS VERSIONES ANTERIORES DE get_game_ranking
DROP FUNCTION IF EXISTS get_game_ranking(text);
DROP FUNCTION IF EXISTS get_game_ranking(game_type_enum);
DROP FUNCTION IF EXISTS get_game_ranking(varchar);

-- 2. CREAR get_game_ranking CON LA ESTRUCTURA CORRECTA
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
  is_pro BOOLEAN
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
    COALESCE(p.is_pro, false) as is_pro
  FROM profiles p
  WHERE p.game_type::text = p_game_type
  ORDER BY p.pwp DESC NULLS LAST;
END;
$$;

-- 3. VERIFICAR QUE LA FUNCIÓN FUNCIONA
DO $$
DECLARE
  test_result RECORD;
  result_count INT := 0;
BEGIN
  RAISE NOTICE '=== PROBANDO get_game_ranking ===';
  
  FOR test_result IN 
    SELECT * FROM get_game_ranking('mtg') LIMIT 5
  LOOP
    result_count := result_count + 1;
    RAISE NOTICE 'Jugador %: % (PWP: %)', result_count, test_result.username, test_result.pwp;
  END LOOP;
  
  IF result_count = 0 THEN
    RAISE NOTICE '⚠️ ADVERTENCIA: No se encontraron jugadores para MTG';
    RAISE NOTICE 'Verificando si hay perfiles en la base de datos...';
    
    SELECT COUNT(*) INTO result_count FROM profiles;
    RAISE NOTICE 'Total de perfiles en la BD: %', result_count;
    
    IF result_count > 0 THEN
      RAISE NOTICE 'Verificando game_type de los perfiles...';
      FOR test_result IN 
        SELECT game_type::text as gt, COUNT(*) as cnt 
        FROM profiles 
        GROUP BY game_type::text
      LOOP
        RAISE NOTICE 'game_type "%": % perfiles', test_result.gt, test_result.cnt;
      END LOOP;
    END IF;
  ELSE
    RAISE NOTICE '✅ Función get_game_ranking funciona correctamente';
  END IF;
END $$;

-- 4. ELIMINAR VERSIONES ANTERIORES DE get_scheduled_events_with_registrations
DROP FUNCTION IF EXISTS get_scheduled_events_with_registrations(text);
DROP FUNCTION IF EXISTS get_scheduled_events_with_registrations(game_type_enum);
DROP FUNCTION IF EXISTS get_scheduled_events_with_registrations(varchar);

-- 5. CREAR get_scheduled_events_with_registrations
CREATE OR REPLACE FUNCTION get_scheduled_events_with_registrations(p_game_type TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  date TEXT,
  store_name TEXT,
  format TEXT,
  registration_count BIGINT,
  created_by UUID,
  max_players INT,
  event_time TEXT,
  is_user_registered BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id,
    se.title,
    se.date::TEXT,
    se.store_name,
    se.format,
    (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = se.id)::BIGINT,
    se.created_by,
    COALESCE(se.max_players, 64)::INT,
    COALESCE(se.time::TEXT, '19:00') as event_time,
    EXISTS(
      SELECT 1 FROM event_registrations er 
      WHERE er.event_id = se.id 
      AND er.player_id = auth.uid()
    ) as is_user_registered
  FROM scheduled_events se
  WHERE se.game_type::text = p_game_type
  ORDER BY se.date ASC;
END;
$$;

-- 6. VERIFICAR scheduled_events
DO $$
DECLARE
  event_count INT := 0;
BEGIN
  RAISE NOTICE '=== VERIFICANDO scheduled_events ===';
  
  SELECT COUNT(*) INTO event_count FROM scheduled_events;
  RAISE NOTICE 'Total de eventos programados: %', event_count;
  
  IF event_count = 0 THEN
    RAISE NOTICE '⚠️ No hay eventos programados en la base de datos';
  ELSE
    RAISE NOTICE '✅ Hay eventos en la base de datos';
  END IF;
END $$;

-- 7. OTORGAR PERMISOS DE EJECUCIÓN
GRANT EXECUTE ON FUNCTION get_game_ranking(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_game_ranking(text) TO anon;
GRANT EXECUTE ON FUNCTION get_scheduled_events_with_registrations(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_scheduled_events_with_registrations(text) TO anon;

RAISE NOTICE '✅ Script completado. Funciones RPC creadas correctamente.';
