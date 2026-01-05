-- =============================================================================
-- FIX MARKETPLACE STATUS - Arregla el problema de anuncios no visibles
-- =============================================================================

-- Paso 1: Agregar columna status si no existe con valor por defecto
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_listings' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE marketplace_listings 
        ADD COLUMN status text DEFAULT 'active';
        RAISE NOTICE '✅ Columna status agregada con default active';
    ELSE
        RAISE NOTICE '✓ Columna status ya existe';
    END IF;
END $$;

-- Paso 2: Actualizar todos los anuncios existentes que tengan status NULL
UPDATE marketplace_listings
SET status = 'active'
WHERE status IS NULL;

-- Paso 3: Verificar cuántos anuncios hay ahora
DO $$
DECLARE
    total_count integer;
    active_count integer;
BEGIN
    SELECT COUNT(*) INTO total_count FROM marketplace_listings;
    SELECT COUNT(*) INTO active_count FROM marketplace_listings WHERE status = 'active';
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '📊 ESTADO DEL MARKETPLACE';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Total de anuncios: %', total_count;
    RAISE NOTICE 'Anuncios activos: %', active_count;
    RAISE NOTICE '';
END $$;

-- Paso 4: Actualizar la función RPC para ser más flexible
DROP FUNCTION IF EXISTS search_marketplace_listings(text, text, text, text);

CREATE OR REPLACE FUNCTION public.search_marketplace_listings(
    p_query text DEFAULT NULL,
    p_type text DEFAULT NULL,
    p_game_type text DEFAULT NULL,
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
    game text,
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
    where_clauses text[] := ARRAY['COALESCE(m.status, ''active'') = ''active'''];
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
            COALESCE(m.game, m.game_type::text, ''mtg'') as game,
            COALESCE(m.format, ''Standard'') as format,
            m.condition,
            m.quantity,
            m.created_at,
            COALESCE(
                (SELECT array_agg(image_url ORDER BY display_order) 
                 FROM public.listing_images 
                 WHERE listing_id = m.id),
                COALESCE(m.images, ARRAY[]::text[])
            ) as images
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

    -- Buscar tanto en game como en game_type
    IF p_game_type IS NOT NULL AND p_game_type <> '' THEN
        where_clauses := array_append(where_clauses, format('(m.game = %L OR m.game_type::text = %L)', p_game_type, p_game_type));
    END IF;

    -- Construir WHERE 
    IF array_length(where_clauses, 1) > 0 THEN
        base_query := base_query || ' WHERE ' || array_to_string(where_clauses, ' AND ');
    END IF;

    -- Ordenamiento
    CASE p_sort
        WHEN 'price_asc' THEN order_clause := 'ORDER BY m.price ASC NULLS LAST';
        WHEN 'price_desc' THEN order_clause := 'ORDER BY m.price DESC NULLS LAST';
        ELSE order_clause := 'ORDER BY m.created_at DESC';
    END CASE;

    base_query := base_query || ' ' || order_clause;

    RETURN QUERY EXECUTE base_query;
END;
$$;

-- Paso 5: Otorgar permisos
GRANT EXECUTE ON FUNCTION public.search_marketplace_listings(text, text, text, text) TO authenticated, anon;

-- Paso 6: Notificar recarga
NOTIFY pgrst, 'reload config';

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ MARKETPLACE STATUS - ARREGLADO';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Todos los anuncios ahora tienen status = active';
    RAISE NOTICE 'La función RPC ha sido actualizada';
    RAISE NOTICE 'Recarga la página del marketplace';
    RAISE NOTICE '';
END $$;
