-- =============================================================================
-- FIX MARKETPLACE RPC - Arregla el error "column m.images does not exist"
-- =============================================================================
-- Este script actualiza la función search_marketplace_listings para:
--   1. Agregar la columna images si no existe
--   2. Usar el parámetro p_game_type para compatibilidad con el frontend
--   3. Manejar correctamente el campo game_type
-- =============================================================================

-- Paso 1: Verificar y agregar la columna images si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_listings' 
        AND column_name = 'images'
    ) THEN
        ALTER TABLE marketplace_listings 
        ADD COLUMN images text[] DEFAULT ARRAY[]::text[];
        RAISE NOTICE '✅ Columna images agregada exitosamente';
    ELSE
        RAISE NOTICE '✓ Columna images ya existe';
    END IF;
END $$;

-- Paso 2: Verificar y agregar la columna game_type si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_listings' 
        AND column_name = 'game_type'
    ) THEN
        ALTER TABLE marketplace_listings 
        ADD COLUMN game_type text;
        RAISE NOTICE '✅ Columna game_type agregada exitosamente';
    ELSE
        RAISE NOTICE '✓ Columna game_type ya existe';
    END IF;
END $$;

-- Paso 3: Migrar datos de 'game' a 'game_type' si están vacíos
UPDATE marketplace_listings
SET game_type = game
WHERE game_type IS NULL AND game IS NOT NULL;

-- Paso 4: Eliminar la función anterior (de cualquier forma)
DROP FUNCTION IF EXISTS search_marketplace_listings(text, text, text, text);
DROP FUNCTION IF EXISTS search_marketplace_listings(text, text, game_type_enum, text);

-- Paso 5: Crear la función actualizada con el parámetro correcto p_game_type
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
            COALESCE(m.game_type, m.game, ''mtg'')::text as game,
            ''Standard'' as format,
            m.condition,
            m.quantity,
            m.created_at,
            COALESCE(m.images, ARRAY[]::text[])
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

    -- Usar COALESCE para buscar en game_type o game
    IF p_game_type IS NOT NULL AND p_game_type <> '' THEN
        where_clauses := array_append(where_clauses, format('(m.game_type = %L OR m.game = %L)', p_game_type, p_game_type));
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

-- Paso 6: Otorgar permisos
GRANT EXECUTE ON FUNCTION public.search_marketplace_listings(text, text, text, text) TO authenticated, anon;

-- Paso 7: Notificar recarga de configuración
NOTIFY pgrst, 'reload config';

-- Paso 8: Verificación final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ FIX MARKETPLACE RPC - COMPLETADO';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'La función search_marketplace_listings ha sido actualizada.';
    RAISE NOTICE 'Ahora usa el parámetro p_game_type correctamente.';
    RAISE NOTICE '';
END $$;
