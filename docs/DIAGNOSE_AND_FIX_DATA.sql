-- =============================================================================
-- DIAGNÓSTICO Y CORRECCIÓN DE DATOS - ThePlayer.gg
-- Este script verifica y corrige los datos de game_type en profiles
-- =============================================================================

-- 1. VERIFICAR ESTADO ACTUAL
DO $$
DECLARE
  total_profiles INT;
  profiles_with_game_type INT;
  profiles_mtg INT;
  rec RECORD;
BEGIN
  RAISE NOTICE '=== DIAGNÓSTICO DE DATOS ===';
  
  -- Total de perfiles
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  RAISE NOTICE 'Total de perfiles: %', total_profiles;
  
  -- Perfiles con game_type definido
  SELECT COUNT(*) INTO profiles_with_game_type 
  FROM profiles 
  WHERE game_type IS NOT NULL;
  RAISE NOTICE 'Perfiles con game_type: %', profiles_with_game_type;
  
  -- Perfiles MTG
  SELECT COUNT(*) INTO profiles_mtg 
  FROM profiles 
  WHERE game_type::text = 'mtg';
  RAISE NOTICE 'Perfiles MTG: %', profiles_mtg;
  
  -- Distribución por game_type
  RAISE NOTICE '--- Distribución por game_type ---';
  FOR rec IN 
    SELECT 
      COALESCE(game_type::text, 'NULL') as gt, 
      COUNT(*) as cnt,
      SUM(COALESCE(pwp, 0)) as total_pwp
    FROM profiles 
    GROUP BY game_type::text
    ORDER BY cnt DESC
  LOOP
    RAISE NOTICE 'game_type "%": % perfiles (PWP total: %)', rec.gt, rec.cnt, rec.total_pwp;
  END LOOP;
END $$;

-- 2. CORREGIR PERFILES SIN game_type
-- Asignar 'mtg' por defecto a todos los perfiles que no tienen game_type
UPDATE profiles
SET game_type = 'mtg'
WHERE game_type IS NULL;

-- 3. VERIFICAR CORRECCIÓN
DO $$
DECLARE
  updated_count INT;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Actualizado game_type a "mtg" para % perfiles', updated_count;
END $$;

-- 4. VERIFICAR DATOS DE TORNEOS
DO $$
DECLARE
  total_tournaments INT;
  tournaments_mtg INT;
  total_results INT;
BEGIN
  RAISE NOTICE '=== VERIFICANDO TORNEOS ===';
  
  SELECT COUNT(*) INTO total_tournaments FROM tournaments;
  RAISE NOTICE 'Total de torneos: %', total_tournaments;
  
  SELECT COUNT(*) INTO tournaments_mtg 
  FROM tournaments 
  WHERE game_type::text = 'mtg';
  RAISE NOTICE 'Torneos MTG: %', tournaments_mtg;
  
  SELECT COUNT(*) INTO total_results FROM tournament_results;
  RAISE NOTICE 'Total de resultados de torneos: %', total_results;
  
  IF total_results = 0 THEN
    RAISE NOTICE '⚠️ ADVERTENCIA: No hay resultados de torneos. El ranking estará vacío.';
  END IF;
END $$;

-- 5. MOSTRAR TOP 10 JUGADORES MTG
DO $$
DECLARE
  rec RECORD;
  rank_num INT := 0;
BEGIN
  RAISE NOTICE '=== TOP 10 JUGADORES MTG ===';
  
  FOR rec IN 
    SELECT 
      username,
      COALESCE(pwp, 0) as pwp,
      COALESCE(matches_won, 0) as wins,
      COALESCE(matches_lost, 0) as losses
    FROM profiles
    WHERE game_type::text = 'mtg'
    ORDER BY pwp DESC NULLS LAST
    LIMIT 10
  LOOP
    rank_num := rank_num + 1;
    RAISE NOTICE '#%: % - % PWP (W:% L:%)', 
      rank_num, rec.username, rec.pwp, rec.wins, rec.losses;
  END LOOP;
  
  IF rank_num = 0 THEN
    RAISE NOTICE '⚠️ No hay jugadores MTG con puntos';
  END IF;
END $$;

-- 6. VERIFICAR SI NECESITAMOS RECALCULAR PWP
DO $$
DECLARE
  profiles_with_zero_pwp INT;
  results_count INT;
BEGIN
  RAISE NOTICE '=== VERIFICANDO NECESIDAD DE RECÁLCULO ===';
  
  SELECT COUNT(*) INTO profiles_with_zero_pwp
  FROM profiles
  WHERE game_type::text = 'mtg' AND COALESCE(pwp, 0) = 0;
  
  SELECT COUNT(*) INTO results_count
  FROM tournament_results;
  
  IF profiles_with_zero_pwp > 0 AND results_count > 0 THEN
    RAISE NOTICE '⚠️ Hay % perfiles MTG con 0 PWP pero existen % resultados', 
      profiles_with_zero_pwp, results_count;
    RAISE NOTICE '💡 Recomendación: Ejecutar FIX_RANKING_SCORES.sql para recalcular puntos';
  ELSE
    RAISE NOTICE '✅ Los datos parecen estar correctos';
  END IF;
END $$;
