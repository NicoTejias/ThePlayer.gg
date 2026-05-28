-- =============================================================================
-- SQL MIGRATION: ADD ALPHA CLASH TCG TO GAME TYPE ENUM
-- =============================================================================
-- Ejecuta este script en el editor SQL de tu panel de Supabase para agregar
-- 'alpha_clash' como un tipo de juego válido y solucionar los errores 400.
-- =============================================================================

-- 1. Agregar 'alpha_clash' al tipo ENUM (si no existe)
ALTER TYPE public.game_type_enum ADD VALUE IF NOT EXISTS 'alpha_clash';

-- 2. Recargar configuración de PostgREST para aplicar cambios inmediatamente
NOTIFY pgrst, 'reload config';
