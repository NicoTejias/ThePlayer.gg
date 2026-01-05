-- =============================================================================
-- FIX MARKETPLACE LISTINGS - Actualización para manejar imágenes correctamente
-- =============================================================================

-- Paso 1: Crear tabla listing_images si no existe
CREATE TABLE IF NOT EXISTS public.listing_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Paso 2: Crear índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON public.listing_images(listing_id);

-- Paso 3: Habilitar RLS en listing_images
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

-- Paso 4: Políticas RLS para listing_images
DROP POLICY IF EXISTS "Anyone can view listing images" ON public.listing_images;
CREATE POLICY "Anyone can view listing images" ON public.listing_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own listing images" ON public.listing_images;
CREATE POLICY "Users can manage own listing images" ON public.listing_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.marketplace_listings
            WHERE id = listing_id AND seller_id = auth.uid()
        )
    );

-- Paso 5: Actualizar la función para incluir imágenes de la tabla listing_images
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
    where_clauses text[] := ARRAY['m.status = ''active'''];
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
                ARRAY[]::text[]
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

-- Paso 6: Otorgar permisos
GRANT EXECUTE ON FUNCTION public.search_marketplace_listings(text, text, text, text) TO authenticated, anon;

-- Paso 7: Verificar políticas RLS en marketplace_listings
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.marketplace_listings;
CREATE POLICY "Anyone can view active listings" ON public.marketplace_listings
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can manage own listings" ON public.marketplace_listings;
CREATE POLICY "Users can manage own listings" ON public.marketplace_listings
    FOR ALL USING (auth.uid() = seller_id);

-- Paso 8: Notificar recarga
NOTIFY pgrst, 'reload config';

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ MARKETPLACE LISTINGS - ACTUALIZADO';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tabla listing_images creada';
    RAISE NOTICE 'Función search_marketplace_listings actualizada';
    RAISE NOTICE 'Políticas RLS configuradas';
    RAISE NOTICE '';
END $$;
