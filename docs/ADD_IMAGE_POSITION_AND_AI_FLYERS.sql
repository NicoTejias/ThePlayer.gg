-- =============================================================================
-- Selector de recorte (image_position) + bucket para flyers IA
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar TODO -> Run. Idempotente.
-- =============================================================================

-- 1. Columna para guardar el punto focal del arte del evento (object-position CSS).
--    Default '50% 50%' = centrado. Ej: '50% 20%' muestra la parte superior.
ALTER TABLE public.scheduled_events
ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT '50% 50%';

-- 2. Recrear la RPC para que devuelva image_position.
--    (basada en FIX_EVENTS_PRICE_AND_LOGO.sql, agregando la nueva columna)
DROP FUNCTION IF EXISTS public.get_scheduled_events_with_registrations(text);

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
  image_url TEXT,
  image_position TEXT
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
    se.image_url,
    COALESCE(se.image_position, '50% 50%') as image_position
  FROM scheduled_events se
  WHERE se.game_type::text = p_game_type
  ORDER BY se.date ASC, se.time ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_scheduled_events_with_registrations(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_scheduled_events_with_registrations(text) TO anon;

-- 3. Bucket público para los flyers generados con IA (Gemini).
--    Se cachea una imagen por torneo; los recurrentes reusan el mismo archivo.
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-flyers', 'event-flyers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas: lectura pública, escritura solo desde el service role (la Edge Function).
DROP POLICY IF EXISTS "Public read event-flyers" ON storage.objects;
CREATE POLICY "Public read event-flyers" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-flyers');

NOTIFY pgrst, 'reload config';
