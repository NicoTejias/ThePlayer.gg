-- =============================================================================
-- MULTI-GAME SUPPORT MIGRATION
-- =============================================================================
-- Este script actualiza la base de datos para soportar múltiples juegos
-- (Magic, Pokemon, One Piece, Juegos de Mesa, etc.)
-- =============================================================================

-- 1. Crear el Tipo ENUM para los juegos
-- Si ya existe, no hará nada (pero el comando fallaría, así que usamos DO block o simplemente intentamos crear)
DO $$ BEGIN
    CREATE TYPE public.game_type_enum AS ENUM (
        'mtg', 
        'pokemon', 
        'one_piece', 
        'lorcana', 
        'flesh_and_blood', 
        'yugioh',
        'star_wars',
        'board_game', 
        'rpg', 
        'warhammer',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Actualizar Tabla TOURNAMENTS
-- Agregar la columna game_type con valor por defecto 'mtg' (para compatibilidad)
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS game_type public.game_type_enum DEFAULT 'mtg';

-- Crear índice para búsquedas rápidas por juego
CREATE INDEX IF NOT EXISTS idx_tournaments_game_type ON public.tournaments(game_type);

-- 3. (Opcional - Futuro) Marketplace
-- Si existiera la tabla marketplace_posts, correríamos esto:
-- ALTER TABLE public.marketplace_posts ADD COLUMN IF NOT EXISTS game_type public.game_type_enum DEFAULT 'mtg';

-- 4. Notificar recarga de caché
NOTIFY pgrst, 'reload config';
