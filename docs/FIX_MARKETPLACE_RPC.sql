-- =============================================================================
-- FIX MARKETPLACE RPC FUNCTION
-- =============================================================================
-- Error: PGRST203: Could not choose the best candidate function
-- Causa: Múltiples definiciones de search_marketplace_listings o parámetros ambiguos
-- =============================================================================

-- 1. ELIMINAR TODAS LAS VERSIONES EXISTENTES
-- =============================================================================
DROP FUNCTION IF EXISTS public.search_marketplace_listings(text, text, text, text);
DROP FUNCTION IF EXISTS public.search_marketplace_listings(text, text, text);
DROP FUNCTION IF EXISTS public.search_marketplace_listings;

-- 2. CREAR LA FUNCIÓN CON FIRMA CLARA
-- =============================================================================
CREATE OR REPLACE FUNCTION public.search_marketplace_listings(
    p_query TEXT DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_game_type TEXT DEFAULT NULL,
    p_sort TEXT DEFAULT 'recent'
)
RETURNS TABLE (
    id UUID,
    seller_id UUID,
    seller_name TEXT,
    seller_region TEXT,
    title TEXT,
    description TEXT,
    listing_type TEXT,
    price NUMERIC,
    game TEXT,
    format TEXT,
    condition TEXT,
    quantity INTEGER,
    created_at TIMESTAMPTZ,
    images TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ml.id,
        ml.seller_id,
        p.username AS seller_name,
        p.region AS seller_region,
        ml.title,
        ml.description,
        ml.listing_type::TEXT,
        ml.price,
        ml.game,
        ml.format,
        ml.condition,
        ml.quantity,
        ml.created_at,
        ml.images
    FROM marketplace_listings ml
    LEFT JOIN profiles p ON ml.seller_id = p.id
    WHERE 
        ml.status = 'active'
        AND (p_query IS NULL OR ml.title ILIKE '%' || p_query || '%' OR ml.description ILIKE '%' || p_query || '%')
        AND (p_type IS NULL OR ml.listing_type::TEXT = p_type)
        AND (p_game_type IS NULL OR ml.game = p_game_type)
    ORDER BY
        CASE 
            WHEN p_sort = 'recent' THEN ml.created_at
            ELSE NULL
        END DESC,
        CASE 
            WHEN p_sort = 'price_asc' THEN ml.price
            ELSE NULL
        END ASC,
        CASE 
            WHEN p_sort = 'price_desc' THEN ml.price
            ELSE NULL
        END DESC,
        ml.created_at DESC;
END;
$$;

-- 3. OTORGAR PERMISOS
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.search_marketplace_listings(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 4. VERIFICAR
-- =============================================================================
DO $$
DECLARE
    v_listing_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN DE MARKETPLACE RPC ===';
    RAISE NOTICE '';
    
    -- Probar la función
    SELECT COUNT(*) INTO v_listing_count
    FROM search_marketplace_listings(NULL, NULL, NULL, 'recent');
    
    RAISE NOTICE '✅ Función creada exitosamente';
    RAISE NOTICE '📊 Listados activos: %', v_listing_count;
    RAISE NOTICE '';
    
    IF v_listing_count = 0 THEN
        RAISE NOTICE '⚠️  No hay listados activos en el marketplace.';
        RAISE NOTICE '💡 Crea un anuncio desde el frontend para probar.';
    ELSE
        RAISE NOTICE '🎉 ¡Marketplace funcionando correctamente!';
    END IF;
END $$;
