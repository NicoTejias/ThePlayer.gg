-- =====================================================
-- SISTEMA DE DISCIPLINA - THEPLAYERGG
-- =====================================================
-- Este script crea las tablas y políticas necesarias para
-- el sistema de Comité de Disciplina y Registro de Infracciones
-- =====================================================

-- =====================================================
-- 1. TABLA DE INFRACCIONES
-- =====================================================
-- Registro individual de cada infracción reportada

CREATE TABLE IF NOT EXISTS infractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Jugador involucrado (puede no tener cuenta)
  player_id UUID REFERENCES profiles(id),
  player_name TEXT NOT NULL,
  
  -- Contexto del incidente
  tournament_id UUID REFERENCES tournaments(id),
  reported_by UUID REFERENCES profiles(id) NOT NULL,
  
  -- Clasificación
  infraction_type TEXT NOT NULL CHECK (infraction_type IN (
    'procedural_error',      -- Error de procedimiento
    'slow_play',             -- Juego lento
    'marked_cards',          -- Cartas marcadas
    'deck_error',            -- Error de mazo
    'unsporting_conduct',    -- Conducta antideportiva leve
    'unsporting_major',      -- Conducta antideportiva grave
    'cheating',              -- Trampa comprobada
    'aggression',            -- Agresión física/verbal
    'other'                  -- Otro
  )),
  
  severity TEXT NOT NULL CHECK (severity IN (
    'caution',      -- Aviso verbal (sin registro formal)
    'warning',      -- Advertencia
    'game_loss',    -- Pérdida de partida
    'match_loss',   -- Pérdida de ronda
    'dq'            -- Descalificación
  )),
  
  -- Detalles
  description TEXT NOT NULL,
  penalty_applied TEXT,
  
  -- Metadatos
  game_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_infractions_player_id ON infractions(player_id);
CREATE INDEX IF NOT EXISTS idx_infractions_player_name ON infractions(player_name);
CREATE INDEX IF NOT EXISTS idx_infractions_tournament ON infractions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_infractions_type ON infractions(infraction_type);
CREATE INDEX IF NOT EXISTS idx_infractions_severity ON infractions(severity);
CREATE INDEX IF NOT EXISTS idx_infractions_created_at ON infractions(created_at);

-- =====================================================
-- 2. TABLA DE CASOS DISCIPLINARIOS
-- =====================================================
-- Casos que requieren revisión del Comité

CREATE TABLE IF NOT EXISTS discipline_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Referencia a infracción origen (opcional - puede ser queja directa)
  infraction_id UUID REFERENCES infractions(id),
  
  -- Número de caso legible
  case_number TEXT UNIQUE,
  
  -- Tipo de caso
  case_type TEXT NOT NULL CHECK (case_type IN (
    'dq_review',           -- Revisión de descalificación
    'judge_complaint',     -- Queja contra juez
    'pattern_review',      -- Revisión de patrón de conducta
    'appeal',              -- Apelación de jugador
    'integrity_report'     -- Reporte de integridad
  )),
  
  -- Estado del caso
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',         -- Pendiente de asignación
    'under_review',    -- En revisión (comité asignado)
    'deliberating',    -- En deliberación (votación)
    'resolved',        -- Resuelto
    'dismissed'        -- Desestimado
  )),
  
  -- Involucrados
  accused_player_id UUID REFERENCES profiles(id),
  accused_player_name TEXT NOT NULL,
  involved_judge_id UUID REFERENCES profiles(id),
  
  -- Declaraciones obligatorias (según propuesta)
  judge_statement TEXT NOT NULL,
  accused_statement TEXT,  -- Derecho a réplica
  additional_evidence TEXT,
  
  -- Resolución
  resolution TEXT,
  sanction_recommendation TEXT CHECK (sanction_recommendation IN (
    'none',               -- Sin sanción adicional
    'formative_feedback', -- Feedback formativo
    'warning',            -- Advertencia formal
    'suspension_30d',     -- Suspensión 30 días
    'suspension_90d',     -- Suspensión 90 días
    'suspension_1y',      -- Suspensión 1 año
    'permanent_ban'       -- Baneo permanente (sugerido)
  )),
  
  -- Metadatos
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  deadline TIMESTAMP,  -- Plazo de 7 días para deliberación
  
  -- Notificaciones
  notification_sent BOOLEAN DEFAULT FALSE
);

-- Secuencia para número de caso
CREATE SEQUENCE IF NOT EXISTS discipline_case_number_seq START 1;

-- Función para generar número de caso automático
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.case_number := 'CASE-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                     LPAD(nextval('discipline_case_number_seq')::TEXT, 4, '0');
  NEW.deadline := NOW() + INTERVAL '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar número de caso
DROP TRIGGER IF EXISTS trg_generate_case_number ON discipline_cases;
CREATE TRIGGER trg_generate_case_number
  BEFORE INSERT ON discipline_cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL)
  EXECUTE FUNCTION generate_case_number();

-- Índices
CREATE INDEX IF NOT EXISTS idx_discipline_cases_status ON discipline_cases(status);
CREATE INDEX IF NOT EXISTS idx_discipline_cases_accused ON discipline_cases(accused_player_id);
CREATE INDEX IF NOT EXISTS idx_discipline_cases_judge ON discipline_cases(involved_judge_id);
CREATE INDEX IF NOT EXISTS idx_discipline_cases_created ON discipline_cases(created_at);

-- =====================================================
-- 3. TABLA DE COMITÉ (miembros por caso)
-- =====================================================
-- Comisión Ad-hoc de 3 miembros para cada caso

CREATE TABLE IF NOT EXISTS discipline_committee (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  case_id UUID REFERENCES discipline_cases(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Rol en el comité
  role TEXT DEFAULT 'member' CHECK (role IN ('chair', 'member')),
  
  -- Inhabilitación por conflicto de interés
  is_recused BOOLEAN DEFAULT FALSE,
  recusal_reason TEXT,
  
  -- Metadatos
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(case_id, member_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_committee_case ON discipline_committee(case_id);
CREATE INDEX IF NOT EXISTS idx_committee_member ON discipline_committee(member_id);

-- =====================================================
-- 4. TABLA DE VOTOS
-- =====================================================
-- Votación de cada miembro del comité

CREATE TABLE IF NOT EXISTS case_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  case_id UUID REFERENCES discipline_cases(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Voto emitido
  vote TEXT NOT NULL CHECK (vote IN (
    'uphold',       -- Mantener sanción original
    'overturn',     -- Revertir sanción
    'increase',     -- Recomendar sanción mayor
    'reduce',       -- Recomendar sanción menor
    'abstain'       -- Abstención
  )),
  
  -- Fundamentación (obligatoria)
  reasoning TEXT NOT NULL,
  
  -- Recomendación específica (opcional)
  recommended_sanction TEXT,
  
  -- Metadatos
  voted_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(case_id, member_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_votes_case ON case_votes(case_id);
CREATE INDEX IF NOT EXISTS idx_votes_member ON case_votes(member_id);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE infractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_committee ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_votes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA infractions
-- =====================================================

-- Jueces pueden crear infracciones
DROP POLICY IF EXISTS "Judges can create infractions" ON infractions;
CREATE POLICY "Judges can create infractions"
  ON infractions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.judge_role IN ('judge', 'head_judge')
      AND profiles.judge_status = 'approved'
    )
  );

-- Jueces y organizadores pueden ver infracciones
DROP POLICY IF EXISTS "Authorized users can view infractions" ON infractions;
CREATE POLICY "Authorized users can view infractions"
  ON infractions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.judge_role IN ('judge', 'head_judge')
        OR profiles.role IN ('store', 'admin')
      )
    )
  );

-- =====================================================
-- POLÍTICAS PARA discipline_cases
-- =====================================================

-- Jueces pueden crear casos
DROP POLICY IF EXISTS "Judges can create cases" ON discipline_cases;
CREATE POLICY "Judges can create cases"
  ON discipline_cases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.judge_role IN ('judge', 'head_judge')
      AND profiles.judge_status = 'approved'
    )
  );

-- Head judges y admins pueden ver todos los casos
DROP POLICY IF EXISTS "Head judges can view all cases" ON discipline_cases;
CREATE POLICY "Head judges can view all cases"
  ON discipline_cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.judge_role = 'head_judge'
        OR profiles.role = 'admin'
      )
    )
  );

-- Miembros del comité pueden ver sus casos asignados
DROP POLICY IF EXISTS "Committee members can view assigned cases" ON discipline_cases;
CREATE POLICY "Committee members can view assigned cases"
  ON discipline_cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM discipline_committee
      WHERE discipline_committee.case_id = discipline_cases.id
      AND discipline_committee.member_id = auth.uid()
    )
  );

-- Head judges pueden actualizar casos
DROP POLICY IF EXISTS "Head judges can update cases" ON discipline_cases;
CREATE POLICY "Head judges can update cases"
  ON discipline_cases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.judge_role = 'head_judge'
      AND profiles.judge_status = 'approved'
    )
  );

-- =====================================================
-- POLÍTICAS PARA discipline_committee
-- =====================================================

-- Head judges pueden asignar comités
DROP POLICY IF EXISTS "Head judges can manage committee" ON discipline_committee;
CREATE POLICY "Head judges can manage committee"
  ON discipline_committee FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.judge_role = 'head_judge'
      AND profiles.judge_status = 'approved'
    )
  );

-- Miembros pueden ver su asignación
DROP POLICY IF EXISTS "Members can view own assignment" ON discipline_committee;
CREATE POLICY "Members can view own assignment"
  ON discipline_committee FOR SELECT
  USING (member_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA case_votes
-- =====================================================

-- Miembros del comité pueden votar en sus casos
DROP POLICY IF EXISTS "Committee members can vote" ON case_votes;
CREATE POLICY "Committee members can vote"
  ON case_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM discipline_committee
      WHERE discipline_committee.case_id = case_votes.case_id
      AND discipline_committee.member_id = auth.uid()
      AND discipline_committee.is_recused = FALSE
    )
  );

-- Miembros pueden ver votos de su caso
DROP POLICY IF EXISTS "Members can view case votes" ON case_votes;
CREATE POLICY "Members can view case votes"
  ON case_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM discipline_committee
      WHERE discipline_committee.case_id = case_votes.case_id
      AND discipline_committee.member_id = auth.uid()
    )
  );

-- Head judges pueden ver todos los votos
DROP POLICY IF EXISTS "Head judges can view all votes" ON case_votes;
CREATE POLICY "Head judges can view all votes"
  ON case_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.judge_role = 'head_judge'
    )
  );

-- =====================================================
-- 6. FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener historial de un jugador
CREATE OR REPLACE FUNCTION get_player_discipline_history(p_player_name TEXT)
RETURNS TABLE (
  infraction_id UUID,
  infraction_type TEXT,
  severity TEXT,
  description TEXT,
  tournament_name TEXT,
  reported_date TIMESTAMP,
  case_id UUID,
  case_status TEXT,
  sanction_recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id AS infraction_id,
    i.infraction_type,
    i.severity,
    i.description,
    t.name AS tournament_name,
    i.created_at AS reported_date,
    dc.id AS case_id,
    dc.status AS case_status,
    dc.sanction_recommendation
  FROM infractions i
  LEFT JOIN tournaments t ON i.tournament_id = t.id
  LEFT JOIN discipline_cases dc ON dc.infraction_id = i.id
  WHERE LOWER(i.player_name) = LOWER(p_player_name)
     OR i.player_id IN (SELECT id FROM profiles WHERE LOWER(username) = LOWER(p_player_name))
  ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear infracción
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
BEGIN
  INSERT INTO infractions (
    player_name, player_id, tournament_id, reported_by,
    infraction_type, severity, description, penalty_applied, game_type
  ) VALUES (
    p_player_name, p_player_id, p_tournament_id, auth.uid(),
    p_infraction_type, p_severity, p_description, p_penalty_applied, p_game_type
  )
  RETURNING id INTO v_infraction_id;
  
  RETURN v_infraction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear caso disciplinario
CREATE OR REPLACE FUNCTION create_discipline_case(
  p_infraction_id UUID DEFAULT NULL,
  p_case_type TEXT DEFAULT 'dq_review',
  p_accused_player_name TEXT DEFAULT '',
  p_accused_player_id UUID DEFAULT NULL,
  p_involved_judge_id UUID DEFAULT NULL,
  p_judge_statement TEXT DEFAULT '',
  p_additional_evidence TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_case_id UUID;
BEGIN
  INSERT INTO discipline_cases (
    infraction_id, case_type, accused_player_name, accused_player_id,
    involved_judge_id, judge_statement, additional_evidence, created_by
  ) VALUES (
    p_infraction_id, p_case_type, p_accused_player_name, p_accused_player_id,
    p_involved_judge_id, p_judge_statement, p_additional_evidence, auth.uid()
  )
  RETURNING id INTO v_case_id;
  
  RETURN v_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para resolver caso
CREATE OR REPLACE FUNCTION resolve_discipline_case(
  p_case_id UUID,
  p_resolution TEXT,
  p_sanction_recommendation TEXT DEFAULT 'none'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE discipline_cases
  SET 
    status = 'resolved',
    resolution = p_resolution,
    sanction_recommendation = p_sanction_recommendation,
    resolved_at = NOW()
  WHERE id = p_case_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. GRANTS
-- =====================================================

GRANT SELECT ON infractions TO authenticated;
GRANT INSERT ON infractions TO authenticated;
GRANT SELECT ON discipline_cases TO authenticated;
GRANT INSERT ON discipline_cases TO authenticated;
GRANT UPDATE ON discipline_cases TO authenticated;
GRANT SELECT ON discipline_committee TO authenticated;
GRANT INSERT ON discipline_committee TO authenticated;
GRANT SELECT ON case_votes TO authenticated;
GRANT INSERT ON case_votes TO authenticated;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
