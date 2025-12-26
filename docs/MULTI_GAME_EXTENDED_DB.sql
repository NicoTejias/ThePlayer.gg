-- =============================================================================
-- EXTENDED MULTI-GAME SUPPORT (MARKETPLACE & EVENTS)
-- =============================================================================
-- Este script extiende el soporte multi-juego a las tablas de Marketplace y Eventos Agendados.
-- =============================================================================

-- 1. Actualizar Tabla MARKETPLACE_LISTINGS
-- =============================================================================
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS game_type public.game_type_enum DEFAULT 'mtg';

-- Migrar datos antiguos (si la columna 'game' era texto)
-- Intentar mapear texto a enum si es posible, sino dejar default
UPDATE public.marketplace_listings 
SET game_type = CASE 
    WHEN game ILIKE '%magic%' THEN 'mtg'::public.game_type_enum
    WHEN game ILIKE '%pokemon%' THEN 'pokemon'::public.game_type_enum
    WHEN game ILIKE '%one piece%' THEN 'one_piece'::public.game_type_enum
    WHEN game ILIKE '%lorcana%' THEN 'lorcana'::public.game_type_enum
    WHEN game ILIKE '%yugioh%' THEN 'yugioh'::public.game_type_enum
    ELSE 'mtg'::public.game_type_enum
END
WHERE game_type IS NULL OR game_type = 'mtg'; -- Solo actualizar si no se ha seteado manual antes

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_marketplace_game_type ON public.marketplace_listings(game_type);


-- 2. Actualizar Tabla SCHEDULED_EVENTS
-- =============================================================================
ALTER TABLE public.scheduled_events 
ADD COLUMN IF NOT EXISTS game_type public.game_type_enum DEFAULT 'mtg';

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_scheduled_events_game_type ON public.scheduled_events(game_type);


-- 3. Actualizar RPC: search_marketplace_listings
-- =============================================================================
CREATE OR REPLACE FUNCTION public.search_marketplace_listings(
    p_query text DEFAULT NULL,
    p_type text DEFAULT NULL,
    p_game_type public.game_type_enum DEFAULT NULL, -- Nuevo parámetro tipado
    p_sort text DEFAULT 'recent'
)
RETURNS TABLE (
    id uuid,
    seller_id uuid,
    seller_name text,
    seller_region text,
    title text,
    description text,
    listing_type text,
    price integer,
    game_type public.game_type_enum, -- Retornar el enum
    format text,
    condition text,
    quantity integer,
    created_at timestamp with time zone,
    images text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    base_query text;
    where_clauses text[] := ARRAY['status = ''active'''];
    order_clause text;
BEGIN
    base_query := '
        SELECT 
            m.id,
            m.seller_id,
            COALESCE(p.username, ''Usuario Desconocido''),
            COALESCE(p.region, ''Sin Región''),
            m.title,
            m.description,
            m.listing_type,
            m.price,
            m.game_type,
            ''Standard'' as format, 
            m.condition,
            m.quantity,
            m.created_at,
            m.images
        FROM public.marketplace_listings m
        LEFT JOIN public.profiles p ON m.seller_id = p.id
    ';

    -- Filtros Dinámicos
    IF p_query IS NOT NULL AND p_query <> '' THEN
        where_clauses := array_append(where_clauses, format('(m.title ILIKE %L OR m.description ILIKE %L)', '%' || p_query || '%', '%' || p_query || '%'));
    END IF;

    IF p_type IS NOT NULL AND p_type <> '' THEN
        where_clauses := array_append(where_clauses, format('m.listing_type = %L', p_type));
    END IF;

    -- Filtro por Game Type (Enum)
    IF p_game_type IS NOT NULL THEN
        where_clauses := array_append(where_clauses, format('m.game_type = %L', p_game_type));
    END IF;

    -- Construir WHERE 
    IF array_length(where_clauses, 1) > 0 THEN
        base_query := base_query || ' WHERE ' || array_to_string(where_clauses, ' AND ');
    END IF;

    -- Ordenamiento
    CASE p_sort
        WHEN 'price_asc' THEN order_clause := 'ORDER BY m.price ASC';
        WHEN 'price_desc' THEN order_clause := 'ORDER BY m.price DESC';
        ELSE order_clause := 'ORDER BY m.created_at DESC';
    END CASE;

    base_query := base_query || ' ' || order_clause;

    RETURN QUERY EXECUTE base_query;
END;
$$;


-- 4. Actualizar RPC: get_scheduled_events_with_registrations
-- =============================================================================
-- AHORA acepta p_game_type para filtrar desde el backend
CREATE OR REPLACE FUNCTION public.get_scheduled_events_with_registrations(
    p_game_type public.game_type_enum DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    date date,
    event_time text,
    format text,
    store_name text,
    max_players integer,
    description text,
    created_by uuid,
    created_at timestamp with time zone,
    registration_count bigint,
    is_user_registered boolean,
    game_type public.game_type_enum
)
LANGUAGE plpgsql -- Cambiado a plpgsql para manejar lógica condicional si fuese necesario, aunque SQL basta, plpgsql es más flexible
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id,
        se.title,
        se.date,
        se.time::text as event_time,
        se.format,
        se.store_name,
        se.max_players,
        se.description,
        se.created_by,
        se.created_at,
        COALESCE(COUNT(er.id), 0) as registration_count,
        EXISTS (
            SELECT 1 FROM public.event_registrations er2
            WHERE er2.event_id = se.id 
            AND er2.player_id = auth.uid()
            AND er2.status = 'confirmed'
        ) as is_user_registered,
        se.game_type
    FROM public.scheduled_events se
    LEFT JOIN public.event_registrations er 
        ON se.id = er.event_id AND er.status = 'confirmed'
    WHERE 
        (p_game_type IS NULL OR se.game_type = p_game_type)
    GROUP BY se.id, se.title, se.date, se.time, se.format, se.store_name, 
             se.max_players, se.description, se.created_by, se.created_at, se.game_type
    ORDER BY se.date ASC, se.time ASC;
END;
$$;

-- Notificar
NOTIFY pgrst, 'reload config';
