CREATE OR REPLACE FUNCTION public.search_marketplace_listings(p_query text DEFAULT NULL::text, p_type text DEFAULT NULL::text, p_game_type text DEFAULT NULL::text, p_sort text DEFAULT 'recent'::text)
 RETURNS TABLE(id uuid, seller_id uuid, seller_name text, seller_region text, title text, description text, listing_type text, price numeric, game text, format text, condition text, quantity integer, created_at timestamp with time zone, images text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        COALESCE(
            (
                SELECT array_agg(li.image_url ORDER BY li.display_order)
                FROM listing_images li
                WHERE li.listing_id = ml.id
            ),
            ARRAY[]::text[]
        ) AS images
    FROM marketplace_listings ml
    LEFT JOIN profiles p ON ml.seller_id = p.id
    WHERE 
        ml.status = 'active'
        AND (p_query IS NULL OR ml.title ILIKE '%' || p_query || '%' OR ml.description ILIKE '%' || p_query || '%')
        AND (p_type IS NULL OR ml.listing_type::TEXT = p_type)
        -- Support filtering by both the legacy 'game' text column and new 'game_type' enum
        AND (p_game_type IS NULL OR ml.game = p_game_type OR ml.game_type::TEXT = p_game_type)
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
$function$;
