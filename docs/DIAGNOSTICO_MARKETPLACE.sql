-- =============================================================================
-- DIAGNÓSTICO MARKETPLACE - Ver qué está pasando con los anuncios
-- =============================================================================

-- 1. Ver todos los anuncios en la tabla
SELECT 
    id,
    seller_id,
    title,
    listing_type,
    game,
    game_type,
    status,
    created_at
FROM marketplace_listings
ORDER BY created_at DESC
LIMIT 10;

-- 2. Ver las imágenes de los anuncios
SELECT 
    li.listing_id,
    ml.title,
    li.image_url,
    li.display_order
FROM listing_images li
JOIN marketplace_listings ml ON li.listing_id = ml.id
ORDER BY ml.created_at DESC, li.display_order
LIMIT 20;

-- 3. Probar la función RPC manualmente
SELECT * FROM search_marketplace_listings(
    NULL,  -- p_query
    NULL,  -- p_type
    'mtg', -- p_game_type
    'recent' -- p_sort
);

-- 4. Ver políticas RLS activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('marketplace_listings', 'listing_images')
ORDER BY tablename, policyname;

-- 5. Verificar si hay anuncios activos
SELECT 
    COUNT(*) as total_listings,
    COUNT(*) FILTER (WHERE status = 'active') as active_listings,
    COUNT(*) FILTER (WHERE status IS NULL) as null_status
FROM marketplace_listings;
