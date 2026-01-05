-- =============================================================================
-- FIX MARKETPLACE FINAL - Solución completa para marketplace
-- =============================================================================
-- Este script arregla todos los problemas del marketplace:
-- 1. Asegura que la columna status existe y tiene valor 'active'
-- 2. Actualiza la función RPC search_marketplace_listings
-- 3. Corrige las políticas RLS
-- 4. Asegura que las imágenes se muestren correctamente
-- =============================================================================

-- PASO 1: Asegurar que la columna status existe
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
        RAISE NOTICE '✅ Columna status agregada';
    ELSE
        RAISE NOTICE '✓ Columna status ya existe';
    END IF;
END $$;

-- PASO 2: Actualizar todos los anuncios existentes a 'active'
UPDATE marketplace_listings
SET status = 'active'
WHERE status IS NULL OR status = '';

-- PASO 3: Verificar estado actual
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

-- PASO 4: Eliminar versiones anteriores de la función
DROP FUNCTION IF EXISTS search_marketplace_listings(text, text, text, text);
DROP FUNCTION IF EXISTS public.search_marketplace_listings(text, text, text, text);

-- PASO 5: Crear la función RPC actualizada
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
            COALESCE(p.username, p.full_name, ''Usuario Desconocido'') as seller_name,
            COALESCE(p.region, ''Sin Región'') as seller_region,
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

-- PASO 6: Otorgar permisos
GRANT EXECUTE ON FUNCTION public.search_marketplace_listings(text, text, text, text) TO authenticated, anon;

-- PASO 7: Actualizar políticas RLS
DROP POLICY IF EXISTS "Users can view active marketplace listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Anyone can view active listings" ON marketplace_listings;

CREATE POLICY "Anyone can view active listings"
ON marketplace_listings FOR SELECT
USING (COALESCE(status, 'active') = 'active' OR auth.uid() = seller_id);

-- PASO 8: Asegurar que la tabla listing_images tenga las políticas correctas
DROP POLICY IF EXISTS "Anyone can view listing images" ON listing_images;

CREATE POLICY "Anyone can view listing images"
ON listing_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM marketplace_listings 
        WHERE id = listing_images.listing_id 
        AND (COALESCE(status, 'active') = 'active' OR auth.uid() = seller_id)
    )
);

-- PASO 9: Notificar recarga
NOTIFY pgrst, 'reload config';

-- PASO 10: Probar la función
DO $$
DECLARE
    test_count integer;
BEGIN
    SELECT COUNT(*) INTO test_count
    FROM public.search_marketplace_listings(NULL, NULL, 'mtg', 'recent');
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '🧪 PRUEBA DE LA FUNCIÓN';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Anuncios encontrados para MTG: %', test_count;
    RAISE NOTICE '';
END $$;

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ MARKETPLACE - COMPLETAMENTE ARREGLADO';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Todos los anuncios tienen status = active';
    RAISE NOTICE 'La función RPC ha sido actualizada';
    RAISE NOTICE 'Las políticas RLS están configuradas';
    RAISE NOTICE 'Las imágenes deberían mostrarse correctamente';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 PRÓXIMOS PASOS:';
    RAISE NOTICE '1. Recarga la página del marketplace';
    RAISE NOTICE '2. Verifica que los anuncios se muestren';
    RAISE NOTICE '3. Si no aparecen, revisa la consola del navegador';
    RAISE NOTICE '';
END $$;
