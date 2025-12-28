-- =====================================================
-- SETUP COMPLETO: SISTEMA DE DISCIPLINA + FORO (VERSIÓN FINAL)
-- =====================================================
-- Ejecuta este script para reparar TODOS los errores de tablas y funciones faltantes.

-- =====================================================
-- 1. TABLAS DEL FORO
-- =====================================================
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

-- RLS FORO
ALTER TABLE judge_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Judges can view threads" ON judge_forum_threads;
DROP POLICY IF EXISTS "Judges can create threads" ON judge_forum_threads;
DROP POLICY IF EXISTS "Judges can view posts" ON judge_forum_posts;
DROP POLICY IF EXISTS "Judges can create posts" ON judge_forum_posts;

CREATE POLICY "Judges can view threads" ON judge_forum_threads
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (judge_role IS NOT NULL OR role IN ('admin', 'organizer'))));

CREATE POLICY "Judges can create threads" ON judge_forum_threads
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (judge_role IS NOT NULL OR role IN ('admin', 'organizer'))));

CREATE POLICY "Judges can view posts" ON judge_forum_posts
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (judge_role IS NOT NULL OR role IN ('admin', 'organizer'))));

CREATE POLICY "Judges can create posts" ON judge_forum_posts
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (judge_role IS NOT NULL OR role IN ('admin', 'organizer'))));


-- =====================================================
-- 2. FUNCIÓN DE INFRACCIONES
-- =====================================================
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
  INSERT INTO infractions (
    player_name, player_id, tournament_id, reported_by,
    infraction_type, severity, description, penalty_applied, game_type
  ) VALUES (
    p_player_name, p_player_id, p_tournament_id, auth.uid(),
    p_infraction_type, p_severity, p_description, p_penalty_applied, p_game_type
  )
  RETURNING id INTO v_infraction_id;

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

  INSERT INTO judge_forum_threads (author_id, title, category) VALUES (auth.uid(), v_thread_title, 'rulings') RETURNING id INTO v_thread_id;
  INSERT INTO judge_forum_posts (thread_id, author_id, content) VALUES (v_thread_id, auth.uid(), v_post_content);
  
  RETURN v_infraction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 3. ACTUALIZACIÓN DE DISCIPLINE CASES (LO QUE FALTABA)
-- =====================================================

-- Agregar columnas necesarias si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discipline_cases' AND column_name = 'witness_statement') THEN
    ALTER TABLE discipline_cases ADD COLUMN witness_statement TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discipline_cases' AND column_name = 'evidence_urls') THEN
    ALTER TABLE discipline_cases ADD COLUMN evidence_urls TEXT[];
  END IF;
END $$;

-- Función create_discipline_case actualizada
CREATE OR REPLACE FUNCTION create_discipline_case(
  p_infraction_id UUID DEFAULT NULL,
  p_case_type TEXT DEFAULT 'dq_review',
  p_accused_player_name TEXT DEFAULT '',
  p_accused_player_id UUID DEFAULT NULL,
  p_involved_judge_id UUID DEFAULT NULL,
  p_judge_statement TEXT DEFAULT '',
  p_additional_evidence TEXT DEFAULT NULL,
  p_witness_statement TEXT DEFAULT NULL,
  p_evidence_urls TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_case_id UUID;
BEGIN
  INSERT INTO discipline_cases (
    infraction_id, case_type, accused_player_name, accused_player_id,
    involved_judge_id, judge_statement, additional_evidence, created_by,
    witness_statement, evidence_urls
  ) VALUES (
    p_infraction_id, p_case_type, p_accused_player_name, p_accused_player_id,
    p_involved_judge_id, p_judge_statement, p_additional_evidence, auth.uid(),
    p_witness_statement, p_evidence_urls
  )
  RETURNING id INTO v_case_id;
  
  RETURN v_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
