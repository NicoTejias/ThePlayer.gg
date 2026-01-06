-- =============================================================================
-- FIX TOURNAMENT UPLOAD - ThePlayer.gg
-- Corrige el error "column alias does not exist" en process_tournament_results_bulk
-- =============================================================================

-- 1. VERIFICAR ESTRUCTURA DE player_aliases
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICANDO TABLA player_aliases ===';
  
  -- Mostrar columnas de la tabla
  FOR rec IN 
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'player_aliases'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Columna: % (tipo: %)', rec.column_name, rec.data_type;
  END LOOP;
END $$;

-- 2. RECREAR process_tournament_results_bulk CON CORRECCIÓN
DROP FUNCTION IF EXISTS process_tournament_results_bulk(uuid, jsonb);

CREATE OR REPLACE FUNCTION process_tournament_results_bulk(
  p_tournament_id UUID,
  p_results JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
  v_player_id UUID;
  v_player_name TEXT;
  v_processed_count INT := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Iterar sobre cada resultado
  FOR v_result IN SELECT * FROM jsonb_to_recordset(p_results) AS x(
    player_name TEXT,
    wins INT,
    losses INT,
    draws INT,
    pwp_earned INT,
    rank INT
  )
  LOOP
    v_player_name := v_result.player_name;
    v_player_id := NULL;

    -- Intentar encontrar el jugador por alias
    -- CORRECCIÓN: Usar alias_name en lugar de alias
    SELECT player_id INTO v_player_id
    FROM player_aliases
    WHERE LOWER(alias_name) = LOWER(v_player_name)
    LIMIT 1;

    -- Si no se encuentra por alias, buscar por username en profiles
    IF v_player_id IS NULL THEN
      SELECT id INTO v_player_id
      FROM profiles
      WHERE LOWER(username) = LOWER(v_player_name)
      LIMIT 1;
    END IF;

    -- Si aún no se encuentra, crear resultado sin vincular
    IF v_player_id IS NULL THEN
      -- Insertar resultado sin player_id (jugador no registrado)
      INSERT INTO tournament_results (
        tournament_id,
        player_name,
        wins,
        losses,
        draws,
        pwp_earned,
        rank
      ) VALUES (
        p_tournament_id,
        v_player_name,
        v_result.wins,
        v_result.losses,
        v_result.draws,
        v_result.pwp_earned,
        v_result.rank
      );
      
      v_errors := array_append(v_errors, 
        format('Jugador "%s" no encontrado - resultado guardado sin vincular', v_player_name)
      );
    ELSE
      -- Insertar resultado vinculado al jugador
      INSERT INTO tournament_results (
        tournament_id,
        player_id,
        player_name,
        wins,
        losses,
        draws,
        pwp_earned,
        rank
      ) VALUES (
        p_tournament_id,
        v_player_id,
        v_player_name,
        v_result.wins,
        v_result.losses,
        v_result.draws,
        v_result.pwp_earned,
        v_result.rank
      );
    END IF;

    v_processed_count := v_processed_count + 1;
  END LOOP;

  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'processed', v_processed_count,
    'errors', v_errors
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'processed', v_processed_count
  );
END;
$$;

-- 3. OTORGAR PERMISOS
GRANT EXECUTE ON FUNCTION process_tournament_results_bulk(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION process_tournament_results_bulk(uuid, jsonb) TO anon;

-- 4. VERIFICAR FUNCIONAMIENTO
DO $$
BEGIN
  RAISE NOTICE '✅ Función process_tournament_results_bulk recreada correctamente';
  RAISE NOTICE 'Ahora puedes intentar subir el torneo nuevamente';
END $$;
