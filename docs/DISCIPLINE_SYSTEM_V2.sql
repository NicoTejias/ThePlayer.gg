-- =====================================================
-- SISTEMA DE DISCIPLINA V2 - FORO Y LOGS
-- =====================================================

-- 1. DISCUSIÓN DE CASOS
CREATE TABLE IF NOT EXISTS case_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES discipline_cases(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Políticas RLS para case_comments
ALTER TABLE case_comments ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Head Judges y miembros del comité asignados al caso
CREATE POLICY "Case comments visible to involved parties" ON case_comments
  FOR SELECT
  USING (
    is_head_judge() OR 
    EXISTS (
      SELECT 1 FROM discipline_committee 
      WHERE case_id = case_comments.case_id 
      AND member_id = auth.uid()
    )
  );

-- Política de escritura: Igual que lectura
CREATE POLICY "Committee members can comment" ON case_comments
  FOR INSERT
  WITH CHECK (
    is_head_judge() OR 
    EXISTS (
      SELECT 1 FROM discipline_committee 
      WHERE case_id = case_comments.case_id 
      AND member_id = auth.uid()
    )
  );

-- 2. FORO DE JUECES

-- Tabla de Hilos
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

-- Tabla de Posts (Respuestas)
CREATE TABLE IF NOT EXISTS judge_forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES judge_forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE judge_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_forum_posts ENABLE ROW LEVEL SECURITY;

-- Políticas Foro: Solo Jueces Certificados y Organizadores pueden ver/escribir
-- (Asumimos que is_judge() verifica si el usuario tiene rol de juez)

CREATE POLICY "Judges can view threads" ON judge_forum_threads
  FOR SELECT USING (is_judge() OR is_organizer());

CREATE POLICY "Judges can create threads" ON judge_forum_threads
  FOR INSERT WITH CHECK (is_judge() OR is_organizer());

-- Solo Head Judges pueden borrar/lockear threads (lógica de UI/Backend, restricción de update)
CREATE POLICY "Head Judges can update threads" ON judge_forum_threads
  FOR UPDATE USING (is_head_judge());
  
CREATE POLICY "Authors can update own threads" ON judge_forum_threads
  FOR UPDATE USING (auth.uid() = author_id);


CREATE POLICY "Judges can view posts" ON judge_forum_posts
  FOR SELECT USING (is_judge() OR is_organizer());

CREATE POLICY "Judges can create posts" ON judge_forum_posts
  FOR INSERT WITH CHECK (is_judge() OR is_organizer());

CREATE POLICY "Authors can update own posts" ON judge_forum_posts
  FOR UPDATE USING (auth.uid() = author_id);


-- 3. ACTUALIZACIONES DE ESQUEMA V2 (Feedback Audio)

-- Agregar campo para declaración de testigo
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discipline_cases' AND column_name = 'witness_statement') THEN
    ALTER TABLE discipline_cases ADD COLUMN witness_statement TEXT;
  END IF;
END $$;

-- Agregar campo para pruebas (URLs)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discipline_cases' AND column_name = 'evidence_urls') THEN
    ALTER TABLE discipline_cases ADD COLUMN evidence_urls TEXT[];
  END IF;
END $$;


-- Indices


-- Indices
CREATE INDEX IF NOT EXISTS idx_case_comments_case ON case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON judge_forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_updated ON judge_forum_threads(updated_at DESC);

-- 4. ACTUALIZACIÓN DE FUNCIONES (RPC)

-- Actualizar función create_discipline_case para incluir witness_statement y evidence_urls
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
