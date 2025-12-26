-- =============================================================================
-- SCRIPT DE REPARACIÓN Y CARACTERÍSTICAS FALTANTES
-- =============================================================================
-- Este script crea las tablas y funciones RPC necesarias para:
-- 1. El Calendario de Eventos
-- 2. El Marketplace (Búsqueda y Listados)
-- 3. El Sistema de Favoritos
--
-- Ejecuta este script en el SQL Editor de Supabase para corregir los errores.
-- =============================================================================

-- =============================================================================
-- 1. TABLAS NECESARIAS (Si no existen)
-- =============================================================================

-- 1.1 Tabla Marketplace Listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    price integer DEFAULT 0,
    game text NOT NULL, -- 'Magic: The Gathering', 'Pokémon TCG', etc.
    listing_type text NOT NULL, -- 'sale', 'buy', 'trade'
    condition text, -- 'Mint', 'Near Mint', etc.
    card_name text,
    card_set text,
    quantity integer DEFAULT 1,
    images text[] DEFAULT ARRAY[]::text[],
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_marketplace_search ON public.marketplace_listings 
USING GIN (to_tsvector('spanish', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(card_name, '')));
CREATE INDEX IF NOT EXISTS idx_marketplace_game ON public.marketplace_listings(game);
CREATE INDEX IF NOT EXISTS idx_marketplace_type ON public.marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_created_at ON public.marketplace_listings(created_at DESC);

-- RLS para Marketplace
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active listings" ON public.marketplace_listings;
CREATE POLICY "Anyone can view active listings" ON public.marketplace_listings
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can manage own listings" ON public.marketplace_listings;
CREATE POLICY "Users can manage own listings" ON public.marketplace_listings
    FOR ALL USING (auth.uid() = seller_id);


-- 1.2 Tabla Favoritos
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id uuid REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, listing_id) -- Evitar duplicados
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites
    FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- 2. FUNCIONES RPC - CALENDARIO
-- =============================================================================

-- 2.1 get_events_by_month
CREATE OR REPLACE FUNCTION public.get_events_by_month(
    p_year integer,
    p_month integer
)
RETURNS TABLE (
    id uuid,
    title text,
    date date,
    event_time time without time zone,
    store_name text,
    format text,
    registration_count bigint,
    max_players integer,
    is_user_registered boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.date,
        e.time as event_time,
        e.store_name,
        e.format,
        (SELECT count(*) FROM public.event_registrations r WHERE r.event_id = e.id) as registration_count,
        e.max_players,
        EXISTS (
            SELECT 1 FROM public.event_registrations r 
            WHERE r.event_id = e.id AND r.player_id = auth.uid()
        ) as is_user_registered
    FROM public.scheduled_events e
    WHERE EXTRACT(YEAR FROM e.date) = p_year
      AND EXTRACT(MONTH FROM e.date) = p_month
    ORDER BY e.date ASC, e.time ASC;
END;
$$;


-- 2.2 get_personalized_events
-- Retorna eventos futuros recomendados (lógica simple por ahora: eventos futuros más cercanos)
CREATE OR REPLACE FUNCTION public.get_personalized_events(
    p_user_id uuid,
    p_limit integer DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    title text,
    date date,
    event_time time without time zone,
    store_name text,
    format text,
    registration_count bigint,
    max_players integer,
    is_user_registered boolean,
    match_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.date,
        e.time as event_time,
        e.store_name,
        e.format,
        (SELECT count(*) FROM public.event_registrations r WHERE r.event_id = e.id) as registration_count,
        e.max_players,
        EXISTS (
            SELECT 1 FROM public.event_registrations r 
            WHERE r.event_id = e.id AND r.player_id = p_user_id
        ) as is_user_registered,
        100 as match_score -- Placeholder score
    FROM public.scheduled_events e
    WHERE e.date >= CURRENT_DATE
    ORDER BY e.date ASC
    LIMIT p_limit;
END;
$$;


-- =============================================================================
-- 3. FUNCIONES RPC - MARKETPLACE
-- =============================================================================

-- 3.1 search_marketplace_listings
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
            m.game,
            ''Standard'' as format, -- Placeholder o agregar columna format a tabla
            m.condition,
            m.quantity,
            m.created_at,
            m.images
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

    IF p_game IS NOT NULL AND p_game <> '' THEN
        where_clauses := array_append(where_clauses, format('m.game = %L', p_game));
    END IF;

    -- Construir WHERE 
    IF array_length(where_clauses, 1) > 0 THEN
        base_query := base_query || ' WHERE ' || array_to_string(where_clauses, ' AND ');
    END IF;

    -- Ordenamiento
    CASE p_sort
        WHEN 'price_asc' THEN order_clause := 'ORDER BY m.price ASC';
        WHEN 'price_desc' THEN order_clause := 'ORDER BY m.price DESC';
        ELSE order_clause := 'ORDER BY m.created_at DESC';
    END CASE;

    base_query := base_query || ' ' || order_clause;

    RETURN QUERY EXECUTE base_query;
END;
$$;


-- =============================================================================
-- 4. FUNCIONES RPC - FAVORITOS
-- =============================================================================

-- 4.1 toggle_favorite
CREATE OR REPLACE FUNCTION public.toggle_favorite(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.favorites WHERE user_id = auth.uid() AND listing_id = p_listing_id) THEN
        DELETE FROM public.favorites WHERE user_id = auth.uid() AND listing_id = p_listing_id;
    ELSE
        INSERT INTO public.favorites (user_id, listing_id) VALUES (auth.uid(), p_listing_id);
    END IF;
END;
$$;


-- 4.2 get_user_favorites
CREATE OR REPLACE FUNCTION public.get_user_favorites(p_limit integer DEFAULT 50)
RETURNS TABLE (
    favorite_id uuid,
    listing_id uuid,
    title text,
    description text,
    price integer,
    condition text,
    card_name text,
    card_set text,
    quantity integer,
    seller_id uuid,
    seller_name text,
    images text[],
    status text,
    created_at timestamp with time zone,
    favorited_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as favorite_id,
        m.id as listing_id,
        m.title,
        m.description,
        m.price,
        m.condition,
        m.card_name,
        m.card_set,
        m.quantity,
        m.seller_id,
        COALESCE(p.username, 'Usuario Desconocido') as seller_name,
        m.images,
        m.status,
        m.created_at,
        f.created_at as favorited_at
    FROM public.favorites f
    JOIN public.marketplace_listings m ON f.listing_id = m.id
    LEFT JOIN public.profiles p ON m.seller_id = p.id
    WHERE f.user_id = auth.uid()
    ORDER BY f.created_at DESC
    LIMIT p_limit;
END;
$$;


-- =============================================================================
-- 5. PERMISOS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.get_events_by_month TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_personalized_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_marketplace_listings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.toggle_favorite TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_favorites TO authenticated;

-- Notificar recarga de configuración (Schema Cache Reload)
NOTIFY pgrst, 'reload config';
