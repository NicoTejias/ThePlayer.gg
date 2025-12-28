-- =====================================================
-- SETUP COMPLETO: SISTEMA DE DISCIPLINA + FORO
-- =====================================================
-- Ejecuta este script para reparar el error "relation judge_forum_threads does not exist"
-- y asegurar que todo el sistema funcione correctamente.

-- 1. CREACIÓN DE TABLAS DEL FORO (Si no existen)
CREATE TABLE IF NOT EXISTS judge_forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('rulings', 'policy', 'tournament_ops', 'off_topic', 'announcements')),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS judge_forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES judge_forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE judge_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_forum_posts ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas antiguas para evitar duplicados
DROP POLICY IF EXISTS "Judges can view threads" ON judge_forum_threads;
DROP POLICY IF EXISTS "Judges can create threads" ON judge_forum_threads;
DROP POLICY IF EXISTS "Judges can view posts" ON judge_forum_posts;
DROP POLICY IF EXISTS "Judges can create posts" ON judge_forum_posts;

-- Crear nuevas políticas
CREATE POLICY "Judges can view threads" ON judge_forum_threads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (judge_role IS NOT NULL OR role IN ('admin', 'organizer')))
  );

CREATE POLICY "Judges can create threads" ON judge_forum_threads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (judge_role IS NOT NULL OR role IN ('admin', 'organizer')))
  );

CREATE POLICY "Judges can view posts" ON judge_forum_posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (judge_role IS NOT NULL OR role IN ('admin', 'organizer')))
  );

CREATE POLICY "Judges can create posts" ON judge_forum_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (judge_role IS NOT NULL OR role IN ('admin', 'organizer')))
  );

-- 3. ACTUALIZACIÓN DE LA FUNCIÓN DE INFRACCIONES
-- Esta función crea la infracción Y automáticamente abre un hilo en el foro
CREATE OR REPLACE FUNCTION create_infraction(
  p_player_name TEXT,
  p_player_id UUID DEFAULT NULL,
  p_tournament_id UUID DEFAULT NULL,
  p_infraction_type TEXT DEFAULT 'other',
  p_severity TEXT DEFAULT 'warning',
  p_description TEXT DEFAULT '',
  p_penalty_applied TEXT DEFAULT NULL,
  p_game_type TEXT DEFAULT 'mtg'
)
RETURNS UUID AS $$
DECLARE
  v_infraction_id UUID;
  v_thread_id UUID;
  v_thread_title TEXT;
  v_post_content TEXT;
  v_reporter_username TEXT;
BEGIN
  -- A. Crear Infracción
  INSERT INTO infractions (
    player_name, player_id, tournament_id, reported_by,
    infraction_type, severity, description, penalty_applied, game_type
  ) VALUES (
    p_player_name, p_player_id, p_tournament_id, auth.uid(),
    p_infraction_type, p_severity, p_description, p_penalty_applied, p_game_type
  )
  RETURNING id INTO v_infraction_id;

  -- B. Preparar datos para el Hilo Automático
  -- Obtener nombre del juez
  SELECT username INTO v_reporter_username FROM profiles WHERE id = auth.uid();
  IF v_reporter_username IS NULL THEN v_reporter_username := 'Juez'; END IF;

  v_thread_title := 'Infracción: ' || p_player_name || ' - ' || INITCAP(REPLACE(p_infraction_type, '_', ' '));
  
  v_post_content := '**Reporte Automático de Infracción**' || E'\n\n' ||
                    '**Jugador:** ' || p_player_name || E'\n' ||
                    '**Infracción:** ' || p_infraction_type || E'\n' ||
                    '**Severidad:** ' || p_severity || E'\n' ||
                    '**Penalización:** ' || COALESCE(p_penalty_applied, 'N/A') || E'\n\n' ||
                    '**Descripción:**' || E'\n' || p_description || E'\n\n' ||
                    'Este hilo ha sido creado automáticamente para discusión entre jueces.';

  -- C. Crear Hilo en el Foro
  INSERT INTO judge_forum_threads (
    author_id, title, category
  ) VALUES (
    auth.uid(), v_thread_title, 'rulings'
  )
  RETURNING id INTO v_thread_id;

  -- D. Crear Primer Post
  INSERT INTO judge_forum_posts (
    thread_id, author_id, content
  ) VALUES (
    v_thread_id, auth.uid(), v_post_content
  );
  
  RETURN v_infraction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
