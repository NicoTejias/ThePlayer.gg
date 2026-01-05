-- =============================================================================
-- FIX PATRICIO Y MEJORA DE LÓGICA DE EMPAREJAMIENTO
-- =============================================================================

DO $$
DECLARE
    v_target_profile_id uuid;
    v_rows_updated int;
BEGIN
    RAISE NOTICE '🔧 Iniciando reparación de cuentas...';

    -- 1. Intentar encontrar el perfil de Patricio Roman
    -- Buscamos por nombre aproximado
    SELECT id INTO v_target_profile_id
    FROM profiles
    WHERE (first_name || ' ' || last_name) ILIKE '%Patricio Roman%'
       OR username ILIKE '%Patricio Roman%'
    LIMIT 1;

    IF v_target_profile_id IS NOT NULL THEN
        RAISE NOTICE '✅ Perfil encontrado: %', v_target_profile_id;

        -- 2. Vincular TODOS los resultados huérfanos que coincidan con su nombre
        UPDATE tournament_results
        SET player_id = v_target_profile_id
        WHERE player_id IS NULL
          AND (player_name ILIKE 'Patricio Roman%' OR player_name ILIKE '%Patricio Roman%');
        
        GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
        RAISE NOTICE '🔗 Se vincularon % resultados al perfil de Patricio.', v_rows_updated;
        
        -- El trigger se dispara automáticamente y recalculará los puntos totales
    ELSE
        RAISE NOTICE '⚠️ PRECAUCIÓN: No se encontró un perfil registrado para Patricio Roman. Se requiere que cree una cuenta o que se ajuste el nombre en la búsqueda.';
    END IF;
END $$;


-- =============================================================================
-- MEJORA PERMANENTE DEL RPC (Para evitar futuros errores similares)
-- =============================================================================
-- Primero borramos la función vieja porque Postgres se queja si cambiamos el tipo de retorno
DROP FUNCTION IF EXISTS public.process_tournament_results_bulk(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.process_tournament_results_bulk(
    p_tournament_id uuid,
    p_results jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_item jsonb;
    target_player_id uuid;
    found_player_id uuid;
    v_game_type text;
BEGIN
    SELECT game_type::text INTO v_game_type FROM tournaments WHERE id = p_tournament_id;

    FOR result_item IN SELECT * FROM jsonb_array_elements(p_results)
    LOOP
        target_player_id := NULL; -- Reset loop variable

        -- 1. Si viene ID explícito, usarlo
        IF (result_item->>'player_id') IS NOT NULL THEN
            target_player_id := (result_item->>'player_id')::uuid;
        ELSE
            -- 2. Búsqueda inteligente de jugador
            -- a) Alias exacto
            SELECT player_id INTO found_player_id
            FROM player_aliases
            WHERE alias ILIKE (result_item->>'player_name')
            LIMIT 1;
            
            IF found_player_id IS NOT NULL THEN
                target_player_id := found_player_id;
            ELSE
                -- b) Username exacto
                SELECT id INTO found_player_id
                FROM profiles
                WHERE username ILIKE (result_item->>'player_name')
                LIMIT 1;

                IF found_player_id IS NOT NULL THEN
                    target_player_id := found_player_id;
                ELSE
                    -- c) NUEVO: Nombre + Apellido (Coincidencia exacta de la cadena completa)
                    SELECT id INTO found_player_id
                    FROM profiles
                    WHERE (first_name || ' ' || last_name) ILIKE (result_item->>'player_name')
                    LIMIT 1;
                    
                    target_player_id := found_player_id; 
                END IF;
            END IF;
        END IF;

        -- 3. Insertar resultado
        INSERT INTO tournament_results (
            tournament_id,
            player_id,
            player_name,
            wins,
            losses,
            draws,
            pwp_earned,
            rank
        )
        VALUES (
            p_tournament_id,
            target_player_id,
            result_item->>'player_name',
            (result_item->>'wins')::int,
            (result_item->>'losses')::int,
            (result_item->>'draws')::int,
            (result_item->>'pwp_earned')::int,
            (result_item->>'rank')::int
        );
    END LOOP;
END;
$$;

DO $$
BEGIN
    RAISE NOTICE '✅ Lógica de emparejamiento mejorada instalada.';
END $$;
