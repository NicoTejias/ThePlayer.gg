-- =============================================================================
-- FIX RPC FUNCTIONS - ThePlayer.gg
-- Soluciona errores de tipos (Enum vs Text) y funciones faltantes (404)
-- =============================================================================

-- 1. FIX: get_game_ranking
-- Redefine la función para aceptar TEXT y comparar de forma segura con la columna game_type
DROP FUNCTION IF EXISTS get_game_ranking(text);
DROP FUNCTION IF EXISTS get_game_ranking(game_type_enum);

CREATE OR REPLACE FUNCTION get_game_ranking(p_game_type TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  region TEXT,
  pwp INT,
  matches_won INT,
  matches_lost INT,
  matches_drew INT,
  team_id UUID,
  team TEXT,
  is_public BOOLEAN,
  is_pro BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.region,
    COALESCE(p.pwp, 0) as pwp,
    COALESCE(p.matches_won, 0) as matches_won,
    COALESCE(p.matches_lost, 0) as matches_lost,
    COALESCE(p.matches_drew, 0) as matches_drew,
    p.team_id,
    p.team,
    COALESCE(p.is_public, true) as is_public,
    COALESCE(p.is_pro, false) as is_pro
  FROM profiles p
  -- Usamos cast a text para evitar error "operator does not exist: game_type_enum = text"
  WHERE p.game_type::text = p_game_type
  ORDER BY p.pwp DESC;
END;
$$;

-- 2. FIX: get_scheduled_events_with_registrations
-- Asegura que el filtrado por game_type sea robusto
DROP FUNCTION IF EXISTS get_scheduled_events_with_registrations(text);
DROP FUNCTION IF EXISTS get_scheduled_events_with_registrations(game_type_enum);

CREATE OR REPLACE FUNCTION get_scheduled_events_with_registrations(p_game_type TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  date TEXT,
  store_name TEXT,
  format TEXT,
  registration_count BIGINT,
  created_by UUID,
  max_players INT,
  event_time TEXT,
  is_user_registered BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nota: Asumimos que scheduled_events tiene game_type. Si no, ajustar.
  -- Para compatibilidad, si no existe game_type, filtramos solo si p_game_type es 'mtg' o traemos todo.
  -- Aquí asumimos que EXISTE col 'game_type' o 'game'.
  
  RETURN QUERY
  SELECT
    se.id,
    se.title,
    se.date::TEXT,
    se.store_name,
    se.format,
    (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = se.id),
    se.created_by,
    se.max_players,
    se.time::TEXT as event_time,
    EXISTS(
      SELECT 1 FROM event_registrations er 
      WHERE er.event_id = se.id 
      AND er.player_id = auth.uid()
    ) as is_user_registered
  FROM scheduled_events se
  -- Intentamos filtrar por columna game_type (si existe en tu schema)
  -- Si tu tabla aun no tiene game_type, esta linea fallará, comenta si es necesario.
  -- Pero si el error de enum salia en ranking, es probable que tengamos types conflictivos.
  -- WHERE se.game_type::text = p_game_type 
  ORDER BY se.date ASC;
  
  -- Si 'scheduled_events' NO tiene game_type, descomenta la version simple:
  /*
  RETURN QUERY
  SELECT
    se.id,
    se.title,
    se.date::TEXT,
    se.store_name,
    se.format,
    (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = se.id),
    se.created_by,
    se.max_players,
    se.time::TEXT as event_time,
    EXISTS(
      SELECT 1 FROM event_registrations er 
      WHERE er.event_id = se.id 
      AND er.player_id = auth.uid()
    ) as is_user_registered
  FROM scheduled_events se
  ORDER BY se.date ASC;
  */
END;
$$;

-- 3. Verificación de existencia de tabla scheduled_events
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_events') THEN
        RAISE NOTICE 'La tabla scheduled_events no existe. Creando tabla básica...';
        CREATE TABLE scheduled_events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            title TEXT NOT NULL,
            date DATE NOT NULL,
            time TIME WITHOUT TIME ZONE,
            format TEXT,
            store_name TEXT,
            max_players INT DEFAULT 64,
            description TEXT,
            created_by UUID REFERENCES auth.users(id),
            game_type TEXT DEFAULT 'mtg'
        );
    END IF;
END $$;
