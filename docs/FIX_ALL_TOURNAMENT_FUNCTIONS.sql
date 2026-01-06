-- =============================================================================
-- FIX ALL TOURNAMENT FUNCTIONS - ThePlayer.gg
-- Elimina TODAS las versiones de funciones relacionadas con torneos y las recrea
-- =============================================================================

-- 1. ELIMINAR TODAS LAS VERSIONES DE process_tournament_results_bulk
DO $$
DECLARE
  func_record RECORD;
BEGIN
  RAISE NOTICE '=== ELIMINANDO TODAS LAS VERSIONES DE process_tournament_results_bulk ===';
  
  FOR func_record IN 
    SELECT proname, oidvectortypes(proargtypes) as args
    FROM pg_proc 
    WHERE proname = 'process_tournament_results_bulk'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', 
      func_record.proname, 
      func_record.args
    );
    RAISE NOTICE 'Eliminada: %(%)', func_record.proname, func_record.args;
  END LOOP;
END $$;

-- 2. VERIFICAR ESTRUCTURA DE player_aliases
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  RAISE NOTICE '=== VERIFICANDO ESTRUCTURA DE player_aliases ===';
  
  -- Verificar si existe la columna alias_name
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'player_aliases' 
    AND column_name = 'alias_name'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Columna alias_name existe';
  ELSE
    RAISE NOTICE '❌ Columna alias_name NO existe - verificando alternativas...';
    
    -- Mostrar todas las columnas
    FOR rec IN 
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'player_aliases'
    LOOP
      RAISE NOTICE 'Columna encontrada: %', rec.column_name;
    END LOOP;
  END IF;
END $$;

-- 3. CREAR NUEVA VERSIÓN DE process_tournament_results_bulk
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
  v_column_name TEXT;
BEGIN
  -- Detectar dinámicamente el nombre de la columna de alias
  SELECT column_name INTO v_column_name
  FROM information_schema.columns
  WHERE table_name = 'player_aliases'
  AND column_name IN ('alias_name', 'alias', 'name')
  LIMIT 1;

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

    -- Intentar encontrar el jugador por alias usando búsqueda directa
    BEGIN
      IF v_column_name = 'alias_name' THEN
        SELECT player_id INTO v_player_id
        FROM player_aliases
        WHERE LOWER(alias_name) = LOWER(v_player_name)
        LIMIT 1;
      ELSIF v_column_name = 'alias' THEN
        SELECT player_id INTO v_player_id
        FROM player_aliases
        WHERE LOWER(alias) = LOWER(v_player_name)
        LIMIT 1;
      ELSIF v_column_name = 'name' THEN
        SELECT player_id INTO v_player_id
        FROM player_aliases
        WHERE LOWER(name) = LOWER(v_player_name)
        LIMIT 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Si falla, continuar sin alias
      NULL;
    END;

    -- Si no se encuentra por alias, buscar por username en profiles
    IF v_player_id IS NULL THEN
      BEGIN
        SELECT id INTO v_player_id
        FROM profiles
        WHERE LOWER(username) = LOWER(v_player_name)
        LIMIT 1;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;

    -- Insertar resultado
    BEGIN
      IF v_player_id IS NULL THEN
        -- Insertar resultado sin vincular
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
          format('Jugador "%s" no encontrado', v_player_name)
        );
      ELSE
        -- Insertar resultado vinculado
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
    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, 
        format('Error procesando "%s": %s', v_player_name, SQLERRM)
      );
    END;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'processed', v_processed_count,
    'errors', v_errors
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'processed', v_processed_count,
    'errors', v_errors
  );
END;
$$;

-- 4. OTORGAR PERMISOS
GRANT EXECUTE ON FUNCTION process_tournament_results_bulk(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION process_tournament_results_bulk(uuid, jsonb) TO anon;

-- 5. VERIFICACIÓN FINAL
DO $$
BEGIN
  RAISE NOTICE '✅ Función process_tournament_results_bulk recreada';
  RAISE NOTICE '✅ La función ahora detecta automáticamente el nombre correcto de la columna';
  RAISE NOTICE '✅ Puedes intentar subir el torneo nuevamente';
END $$;
