-- FIX MARKETPLACE GAME_TYPE - Versión Corregida para Supabase
-- Este script corrige el problema de la columna game_type en marketplace_listings

-- Paso 1: Verificar si la columna game_type ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_listings' 
        AND column_name = 'game_type'
    ) THEN
        -- Si no existe, agregarla
        ALTER TABLE marketplace_listings 
        ADD COLUMN game_type game_type_enum;
        
        RAISE NOTICE 'Columna game_type agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna game_type ya existe';
    END IF;
END $$;

-- Paso 2: Migrar datos de la columna 'game' a 'game_type' con CAST explícito
UPDATE marketplace_listings
SET game_type = game::game_type_enum
WHERE game_type IS NULL AND game IS NOT NULL;

-- Paso 3: Verificar la migración
SELECT 
    COUNT(*) as total_listings,
    COUNT(game_type) as with_game_type,
    COUNT(*) - COUNT(game_type) as missing_game_type
FROM marketplace_listings;

-- Paso 4: Actualizar la función de búsqueda para usar game_type
CREATE OR REPLACE FUNCTION search_marketplace_listings(
    search_query TEXT DEFAULT NULL,
    filter_game game_type_enum DEFAULT NULL,
    filter_condition TEXT DEFAULT NULL,
    filter_language TEXT DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    seller_id UUID,
    game_type game_type_enum,
    card_name TEXT,
    card_set TEXT,
    card_number TEXT,
    condition TEXT,
    language TEXT,
    price DECIMAL,
    quantity INTEGER,
    images TEXT[],
    description TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    seller_name TEXT,
    seller_store_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ml.id,
        ml.seller_id,
        ml.game_type,
        ml.card_name,
        ml.card_set,
        ml.card_number,
        ml.condition,
        ml.language,
        ml.price,
        ml.quantity,
        ml.images,
        ml.description,
        ml.status,
        ml.created_at,
        p.full_name as seller_name,
        p.store_name as seller_store_name
    FROM marketplace_listings ml
    LEFT JOIN profiles p ON ml.seller_id = p.id
    WHERE 
        ml.status = 'active'
        AND (search_query IS NULL OR (
            ml.card_name ILIKE '%' || search_query || '%' OR
            ml.card_set ILIKE '%' || search_query || '%' OR
            ml.description ILIKE '%' || search_query || '%'
        ))
        AND (filter_game IS NULL OR ml.game_type = filter_game)
        AND (filter_condition IS NULL OR ml.condition = filter_condition)
        AND (filter_language IS NULL OR ml.language = filter_language)
        AND (min_price IS NULL OR ml.price >= min_price)
        AND (max_price IS NULL OR ml.price <= max_price)
    ORDER BY ml.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Paso 5: Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_marketplace_game_type 
ON marketplace_listings(game_type) 
WHERE status = 'active';

-- Paso 6: Actualizar RLS policies si es necesario
DROP POLICY IF EXISTS "Users can view active marketplace listings" ON marketplace_listings;

CREATE POLICY "Users can view active marketplace listings"
ON marketplace_listings FOR SELECT
USING (status = 'active' OR auth.uid() = seller_id);

-- Paso 7: Verificación final
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM marketplace_listings
    WHERE game_type IS NULL AND status = 'active';
    
    IF missing_count > 0 THEN
        RAISE WARNING 'Hay % listings activos sin game_type asignado', missing_count;
    ELSE
        RAISE NOTICE 'Todos los listings activos tienen game_type asignado correctamente';
    END IF;
END $$;

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '✅ Script completado exitosamente';
    RAISE NOTICE 'Verifica los resultados arriba';
END $$;
