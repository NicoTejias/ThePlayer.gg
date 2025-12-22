-- =============================================================================
-- THEPLAYER.GG - RPC Functions for Tournament Processing
-- =============================================================================
-- Este archivo contiene las funciones RPC que deben existir en Supabase para
-- que el sistema de upload de torneos funcione correctamente.
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard
-- 2. SQL Editor
-- 3. Ejecuta este script para crear/actualizar las funciones
-- =============================================================================


-- -----------------------------------------------------------------------------
-- FUNCIÓN 1: create_tournament_via_rpc
-- Crea un nuevo registro de torneo
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_tournament_via_rpc(
    p_id uuid,
    p_name text,
    p_date date,
    p_store_name text,
    p_format text,
    p_player_count integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.tournaments (id, name, date, store_name, format, player_count, created_at)
    VALUES (p_id, p_name, p_date, p_store_name, p_format, p_player_count, now());
END;
$$;


-- -----------------------------------------------------------------------------
-- FUNCIÓN 2: process_tournament_results_bulk
-- Esta función procesa los resultados de un torneo y actualiza los PWP de los jugadores
--
-- FLUJO:
-- 1. Por cada resultado del torneo, buscar si el player_name coincide con:
--    a) Un alias en player_aliases (alias_name)
--    b) El username de un perfil
--    c) El first_name + last_name de un perfil
-- 2. Si encuentra match, actualizar el PWP del perfil encontrado
-- 3. Insertar el resultado en tournament_results con o sin player_id
-- -----------------------------------------------------------------------------

-- IMPORTANTE: Eliminar la función existente primero (tiene un tipo de retorno diferente)
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
        -- ESTRATEGIA DE MATCHING (en orden de prioridad)
        -- =====================================================================
        
        -- 1. Buscar en player_aliases (coincidencia exacta)
        SELECT player_id INTO found_player_id
        FROM public.player_aliases
        WHERE LOWER(alias_name) = LOWER(clean_name)
        LIMIT 1;
        
        -- 2. Si no encontró, buscar por username en profiles
        IF found_player_id IS NULL THEN
            SELECT id INTO found_player_id
            FROM public.profiles
            WHERE LOWER(username) = LOWER(clean_name)
              AND role = 'player'
            LIMIT 1;
        END IF;
        
        -- 3. Si no encontró, buscar por first_name + last_name
        IF found_player_id IS NULL THEN
            SELECT id INTO found_player_id
            FROM public.profiles
            WHERE LOWER(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) = LOWER(clean_name)
              AND role = 'player'
            LIMIT 1;
        END IF;
        
        -- 4. Si no encontró, buscar al revés: last_name + first_name
        IF found_player_id IS NULL THEN
            SELECT id INTO found_player_id
            FROM public.profiles
            WHERE LOWER(TRIM(COALESCE(last_name, '') || ' ' || COALESCE(first_name, ''))) = LOWER(clean_name)
              AND role = 'player'
            LIMIT 1;
        END IF;
        
        -- 5. Búsqueda parcial (más flexible, pero puede causar falsos positivos)
        -- DESHABILITADO por defecto para evitar errores
        /*
        IF found_player_id IS NULL THEN
            SELECT id INTO found_player_id
            FROM public.profiles
            WHERE (LOWER(username) LIKE '%' || LOWER(clean_name) || '%'
                   OR LOWER(clean_name) LIKE '%' || LOWER(username) || '%')
              AND role = 'player'
            LIMIT 1;
        END IF;
        */
        
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
            found_player_id,  -- Puede ser NULL si no se encontró match
            clean_name,
            (result->>'wins')::int,
            (result->>'losses')::int,
            (result->>'draws')::int,
            (result->>'pwp_earned')::int,
            (result->>'rank')::int,
            now()
        );
        
        -- =====================================================================
        -- ACTUALIZAR PWP DEL JUGADOR (solo si se encontró)
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


-- -----------------------------------------------------------------------------
-- TABLA: player_aliases (si no existe)
-- Almacena los aliases que los jugadores usan en torneos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_aliases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    alias_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(alias_name)  -- Un alias solo puede pertenecer a un jugador
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_player_aliases_name_lower 
ON public.player_aliases (LOWER(alias_name));

CREATE INDEX IF NOT EXISTS idx_player_aliases_player_id 
ON public.player_aliases (player_id);


-- -----------------------------------------------------------------------------
-- RLS Policies para player_aliases
-- -----------------------------------------------------------------------------
ALTER TABLE public.player_aliases ENABLE ROW LEVEL SECURITY;

-- Los jugadores pueden leer sus propios aliases
DROP POLICY IF EXISTS "Users can read own aliases" ON public.player_aliases;
CREATE POLICY "Users can read own aliases" ON public.player_aliases
    FOR SELECT USING (auth.uid() = player_id);

-- Los jugadores pueden insertar sus propios aliases
DROP POLICY IF EXISTS "Users can insert own aliases" ON public.player_aliases;
CREATE POLICY "Users can insert own aliases" ON public.player_aliases
    FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Los jugadores pueden eliminar sus propios aliases
DROP POLICY IF EXISTS "Users can delete own aliases" ON public.player_aliases;
CREATE POLICY "Users can delete own aliases" ON public.player_aliases
    FOR DELETE USING (auth.uid() = player_id);


-- -----------------------------------------------------------------------------
-- GRANTS (permisos para las funciones RPC)
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_tournament_via_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_tournament_results_bulk TO authenticated;


-- -----------------------------------------------------------------------------
-- EJEMPLO DE USO:
-- -----------------------------------------------------------------------------
-- Desde el frontend (JavaScript):
--
-- // 1. Crear torneo
-- await supabase.rpc('create_tournament_via_rpc', {
--     p_id: crypto.randomUUID(),
--     p_name: 'FNM - 2024-01-15',
--     p_date: '2024-01-15',
--     p_store_name: 'Mi Tienda',
--     p_format: 'Standard',
--     p_player_count: 16
-- });
--
-- // 2. Subir resultados
-- await supabase.rpc('process_tournament_results_bulk', {
--     p_tournament_id: 'uuid-del-torneo',
--     p_results: [
--         { player_name: 'Juan Perez', wins: 3, losses: 1, draws: 0, pwp_earned: 10, rank: 1 },
--         { player_name: 'Maria Garcia', wins: 2, losses: 2, draws: 0, pwp_earned: 7, rank: 2 }
--     ]
-- });
-- -----------------------------------------------------------------------------
