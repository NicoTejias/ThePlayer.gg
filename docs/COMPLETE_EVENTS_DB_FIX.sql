-- =============================================================================
-- SOLUCIÓN COMPLETA: Columnas de Base de Datos, RLS y Funciones para Eventos
-- Ejecuta este script completo en el SQL Editor de tu panel de Supabase
-- =============================================================================

-- 1. Asegurar que las columnas existan en la tabla scheduled_events
ALTER TABLE public.scheduled_events 
ADD COLUMN IF NOT EXISTS entry_fee TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'mtg';

-- 2. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Anyone can view scheduled events" ON public.scheduled_events;
DROP POLICY IF EXISTS "Stores and admins can create events" ON public.scheduled_events;
DROP POLICY IF EXISTS "Users can update own events" ON public.scheduled_events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.scheduled_events;
DROP POLICY IF EXISTS "Users and admins can update events" ON public.scheduled_events;
DROP POLICY IF EXISTS "Users and admins can delete events" ON public.scheduled_events;

-- 3. Recrear Políticas RLS
-- Todos pueden ver eventos
CREATE POLICY "Anyone can view scheduled events" ON public.scheduled_events
    FOR SELECT USING (true);

-- Tiendas y admins pueden crear
CREATE POLICY "Stores and admins can create events" ON public.scheduled_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('store', 'admin')
        )
    );

-- Dueño de la tienda y Admins pueden actualizar
CREATE POLICY "Users and admins can update events" ON public.scheduled_events
    FOR UPDATE USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Dueño de la tienda y Admins pueden eliminar
CREATE POLICY "Users and admins can delete events" ON public.scheduled_events
    FOR DELETE USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 4. Recrear la función RPC para listar los eventos con todos sus campos
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

GRANT EXECUTE ON FUNCTION get_scheduled_events_with_registrations(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_scheduled_events_with_registrations(text) TO anon;
