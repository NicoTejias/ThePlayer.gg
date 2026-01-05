-- =============================================================================
-- SCRIPT DE VERIFICACIÓN (TEST) - ThePlayer.gg
-- Misión: Probar que la base de datos actualiza el ranking automáticamente.
-- =============================================================================

DO $$
DECLARE
    v_player_id uuid;
    v_tournament_id uuid;
    v_initial_pwp int;
    v_new_pwp int;
    v_final_pwp int;
    v_test_result_id uuid;
BEGIN
    RAISE NOTICE '🚀 INICIANDO TEST DE SINCRONIZACIÓN...';

    -- 1. Obtener un jugador cualquiera para la prueba (el primero que encontremos)
    SELECT id, pwp INTO v_player_id, v_initial_pwp FROM profiles LIMIT 1;
    
    IF v_player_id IS NULL THEN
        RAISE EXCEPTION '❌ No se encontraron jugadores en la tabla profiles. Crea al menos uno para probar.';
    END IF;

    RAISE NOTICE '👤 Jugador de prueba seleccionado: % (Puntos Iniciales: %)', v_player_id, v_initial_pwp;

    -- 1b. Asegurar que existe la columna created_by (Fix Trigger Error)
    -- El trigger 'notify_new_tournament' falla si esta columna no existe.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'created_by') THEN
        ALTER TABLE tournaments ADD COLUMN created_by uuid REFERENCES profiles(id);
        RAISE NOTICE '🔧 Columna created_by agregada automáticamente para corregir el trigger.';
    END IF;

    -- 2. Crear un torneo falso temporal
    -- Nota: Usamos store_name en lugar de store_id si la columna no existe
    INSERT INTO tournaments (name, date, format, store_name, game_type, created_by)
    VALUES ('Torneo de Prueba AUTOMATIZADO', '2025-01-01', 'modern', 'ThePlayer Test Store', 'mtg', v_player_id)
    RETURNING id INTO v_tournament_id;

    RAISE NOTICE '🏆 Torneo de prueba creado: %', v_tournament_id;

    -- 3. Insertar un resultado para este jugador (+10 puntos)
    -- Esto debería disparar el TRIGGER y actualizar profiles.pwp
    INSERT INTO tournament_results (tournament_id, player_id, player_name, wins, losses, draws, pwp_earned, rank)
    VALUES (v_tournament_id, v_player_id, 'Tester', 3, 0, 0, 10, 1)
    RETURNING id INTO v_test_result_id;

    RAISE NOTICE '📝 Resultado insertado (+10 PWP). ID: %', v_test_result_id;

    -- 4. Verificar nueva puntuación
    SELECT pwp INTO v_new_pwp FROM profiles WHERE id = v_player_id;

    RAISE NOTICE '📊 Puntos después de la inserción: %', v_new_pwp;

    IF v_new_pwp = v_initial_pwp + 10 THEN
        RAISE NOTICE '✅ ÉXITO: Los puntos se sumaron automáticamente.';
    ELSE
        RAISE EXCEPTION '❌ ERROR: Los puntos no coinciden. Esperado: %, Real: %', (v_initial_pwp + 10), v_new_pwp;
    END IF;

    -- 5. Limpiar datos (Borrar resultado y torneo)
    DELETE FROM tournament_results WHERE id = v_test_result_id;
    -- Al borrar, el trigger debería restar los puntos
    
    SELECT pwp INTO v_final_pwp FROM profiles WHERE id = v_player_id;
    
    RAISE NOTICE '🧹 Limpieza realizada. Puntos finales: %', v_final_pwp;

    -- Borrar torneo
    DELETE FROM tournaments WHERE id = v_tournament_id;

    IF v_final_pwp = v_initial_pwp THEN
         RAISE NOTICE '✅ ÉXITO: Los puntos volvieron a su estado original.';
    ELSE
         RAISE EXCEPTION '❌ ERROR: Los puntos no se restauraron. Esperado: %, Real: %', v_initial_pwp, v_final_pwp;
    END IF;

    RAISE NOTICE '🎉 CONCLUSIÓN: EL SISTEMA DE PUNTOS AUTOMÁTICOS FUNCIONA PERFECTAMENTE.';
    
END $$;
