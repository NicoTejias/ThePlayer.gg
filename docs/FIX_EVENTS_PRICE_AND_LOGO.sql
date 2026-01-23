-- =============================================================================
-- ARREGLO DEFINITIVO: Columnas y Función de Eventos
-- Ejecuta todo este código en el SQL Editor de Supabase
-- =============================================================================

-- 1. Agregar las columnas que faltan a la tabla (si no existen)
ALTER TABLE public.scheduled_events 
ADD COLUMN IF NOT EXISTS entry_fee TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Eliminar la versión anterior de la función para evitar error de tipos
DROP FUNCTION IF EXISTS public.get_scheduled_events_with_registrations(text);

-- 3. Crear la nueva versión que incluye todos los datos
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
  is_user_registered BOOLEAN,
  entry_fee TEXT,
  description TEXT,
  game_type TEXT,
  image_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id,
    se.title,
    se.date::TEXT,
    se.store_name,
    se.format,
    (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = se.id)::BIGINT as registration_count,
    se.created_by,
    COALESCE(se.max_players, 64)::INT as max_players,
    COALESCE(se.time::TEXT, '19:00') as event_time,
    EXISTS(
      SELECT 1 FROM event_registrations er 
      WHERE er.event_id = se.id 
      AND er.player_id = auth.uid()
    ) as is_user_registered,
    se.entry_fee::TEXT,
    se.description,
    se.game_type::TEXT,
    se.image_url
  FROM scheduled_events se
  WHERE se.game_type::text = p_game_type
  ORDER BY se.date ASC, se.time ASC;
END;
$$;

-- 4. Otorgar permisos
GRANT EXECUTE ON FUNCTION get_scheduled_events_with_registrations(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_scheduled_events_with_registrations(text) TO anon;
