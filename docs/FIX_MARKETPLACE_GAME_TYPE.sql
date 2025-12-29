-- Fix marketplace_listings table to add game_type column and constraint
-- This resolves the "null value in column 'game' violates not-null constraint" error

-- Step 1: Add game_type column (nullable first)
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS game_type text;

-- Step 2: Copy data from 'game' to 'game_type' if game column exists
UPDATE public.marketplace_listings 
SET game_type = game 
WHERE game_type IS NULL AND game IS NOT NULL;

-- Step 3: Set default value for game_type
ALTER TABLE public.marketplace_listings 
ALTER COLUMN game_type SET DEFAULT 'mtg';

-- Step 4: Make game_type NOT NULL (after data migration)
ALTER TABLE public.marketplace_listings 
ALTER COLUMN game_type SET NOT NULL;

-- Step 5: Drop the old 'game' column if it exists
ALTER TABLE public.marketplace_listings 
DROP COLUMN IF EXISTS game;

-- Step 6: Create index on game_type
CREATE INDEX IF NOT EXISTS idx_marketplace_game_type ON public.marketplace_listings(game_type);

-- Step 7: Update search function to use game_type instead of game
CREATE OR REPLACE FUNCTION public.search_marketplace_listings(
    p_query text DEFAULT NULL,
    p_type text DEFAULT NULL,
    p_game text DEFAULT NULL,
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
    game_type text,
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

    -- Dynamic Filters
    IF p_query IS NOT NULL AND p_query <> '' THEN
        where_clauses := array_append(where_clauses, format('(m.title ILIKE %L OR m.description ILIKE %L)', '%' || p_query || '%', '%' || p_query || '%'));
    END IF;

    IF p_type IS NOT NULL AND p_type <> '' THEN
        where_clauses := array_append(where_clauses, format('m.listing_type = %L', p_type));
    END IF;

    IF p_game IS NOT NULL AND p_game <> '' THEN
        where_clauses := array_append(where_clauses, format('m.game_type = %L', p_game));
    END IF;

    -- Build WHERE clause
    IF array_length(where_clauses, 1) > 0 THEN
        base_query := base_query || ' WHERE ' || array_to_string(where_clauses, ' AND ');
    END IF;

    -- Sorting
    CASE p_sort
        WHEN 'price_asc' THEN order_clause := 'ORDER BY m.price ASC';
        WHEN 'price_desc' THEN order_clause := 'ORDER BY m.price DESC';
        ELSE order_clause := 'ORDER BY m.created_at DESC';
    END CASE;

    base_query := base_query || ' ' || order_clause;

    RETURN QUERY EXECUTE base_query;
END;
$$;

-- Notify reload
NOTIFY pgrst, 'reload config';
