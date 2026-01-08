-- Re-create get_user_favorites to ensure it works correctly
CREATE OR REPLACE FUNCTION public.get_user_favorites(p_limit integer DEFAULT 50)
 RETURNS TABLE(favorite_id uuid, listing_id uuid, title text, description text, price numeric, condition text, card_name text, card_set text, quantity integer, seller_id uuid, seller_name text, images text[], status text, created_at timestamp with time zone, favorited_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as favorite_id,
        l.id as listing_id,
        l.title,
        l.description,
        l.price,
        l.condition,
        l.card_name,
        l.card_set,
        l.quantity,
        l.seller_id,
        p.username as seller_name,
        l.images,
        l.status,
        l.created_at,
        f.created_at as favorited_at
    FROM marketplace_favorites f
    JOIN marketplace_listings l ON l.id = f.listing_id
    JOIN profiles p ON p.id = l.seller_id
    WHERE f.user_id = auth.uid()
      AND l.status = 'active'
    ORDER BY f.created_at DESC
    LIMIT p_limit;
END;
$function$;

-- Ensure permissions
GRANT EXECUTE ON FUNCTION public.get_user_favorites(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_favorites(integer) TO service_role;
