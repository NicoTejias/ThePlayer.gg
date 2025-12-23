-- =============================================================================
-- ACTUALIZACIÓN: SOLO VINCULAR POR ALIASES 
-- =============================================================================
-- Ejecuta esto en Supabase para que los jugadores SOLO se vinculen cuando
-- hayan registrado su alias explícitamente en Settings.
--
-- Esto evita que jugadores aparezcan con su nombre real solo porque
-- coincide con un username o first_name + last_name.
-- =============================================================================

DROP FUNCTION IF EXISTS public.process_tournament_results_bulk(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.process_tournament_results_bulk(
    p_tournament_id uuid,
    p_results jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    found_player_id uuid;
    clean_name text;
    matched_count integer := 0;
    unmatched_count integer := 0;
    unmatched_names text[] := ARRAY[]::text[];
BEGIN
    -- Iterar sobre cada resultado del torneo
    FOR result IN SELECT * FROM jsonb_array_elements(p_results)
    LOOP
        found_player_id := NULL;
        clean_name := TRIM(result->>'player_name');
        
        -- =====================================================================
        -- MATCHING SOLO POR ALIASES REGISTRADOS
        -- =====================================================================
        -- Solo buscamos en player_aliases. 
        -- NO buscamos por username ni por first_name/last_name.
        -- El jugador DEBE haber agregado su nombre de torneo como alias.
        -- =====================================================================
        
        SELECT player_id INTO found_player_id
        FROM public.player_aliases
        WHERE LOWER(alias_name) = LOWER(clean_name)
        LIMIT 1;
        
        -- =====================================================================
        -- INSERTAR RESULTADO DEL TORNEO
        -- =====================================================================
        INSERT INTO public.tournament_results (
            tournament_id,
            player_id,
            player_name,
            wins,
            losses,
            draws,
            pwp_earned,
            rank,
            created_at
        ) VALUES (
            p_tournament_id,
            found_player_id,  -- NULL si no hay alias registrado
            clean_name,
            (result->>'wins')::int,
            (result->>'losses')::int,
            (result->>'draws')::int,
            (result->>'pwp_earned')::int,
            (result->>'rank')::int,
            now()
        );
        
        -- =====================================================================
        -- ACTUALIZAR PWP DEL JUGADOR (solo si se encontró via alias)
        -- =====================================================================
        IF found_player_id IS NOT NULL THEN
            UPDATE public.profiles
            SET 
                pwp = COALESCE(pwp, 0) + (result->>'pwp_earned')::int,
                matches_won = COALESCE(matches_won, 0) + (result->>'wins')::int,
                matches_lost = COALESCE(matches_lost, 0) + (result->>'losses')::int,
                matches_drew = COALESCE(matches_drew, 0) + (result->>'draws')::int,
                updated_at = now()
            WHERE id = found_player_id;
            
            matched_count := matched_count + 1;
        ELSE
            unmatched_count := unmatched_count + 1;
            unmatched_names := array_append(unmatched_names, clean_name);
        END IF;
    END LOOP;
    
    -- Retornar estadísticas del procesamiento
    RETURN jsonb_build_object(
        'success', true,
        'matched_players', matched_count,
        'unmatched_players', unmatched_count,
        'unmatched_names', unmatched_names
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_tournament_results_bulk TO authenticated;
