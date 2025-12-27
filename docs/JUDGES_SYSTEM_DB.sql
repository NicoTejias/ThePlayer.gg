-- =====================================================
-- SISTEMA DE JUECES - THEPLAYERGG
-- =====================================================
-- Este script crea las tablas y políticas necesarias para
-- el sistema de gestión de jueces

-- =====================================================
-- 1. ACTUALIZAR TABLA PROFILES
-- =====================================================

-- Agregar campos de juez a la tabla profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS judge_role TEXT CHECK (judge_role IN ('applicant', 'judge', 'head_judge'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS judge_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS judge_certification_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS judge_bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS judge_specialties TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS judge_region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS judge_status TEXT DEFAULT 'pending' CHECK (judge_status IN ('pending', 'approved', 'suspended', 'retired'));

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_judge_role ON profiles(judge_role);
CREATE INDEX IF NOT EXISTS idx_profiles_judge_status ON profiles(judge_status);

-- =====================================================
-- 2. TABLA DE APLICACIONES DE JUECES
-- =====================================================

CREATE TABLE IF NOT EXISTS judge_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  requested_level TEXT NOT NULL,
  experience_years INTEGER,
  previous_certifications TEXT,
  motivation TEXT NOT NULL,
  referee_contacts TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_judge_applications_applicant ON judge_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_judge_applications_status ON judge_applications(status);

-- =====================================================
-- 3. TABLA DE ASIGNACIONES DE JUECES
-- =====================================================

CREATE TABLE IF NOT EXISTS judge_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'judge' CHECK (role IN ('head_judge', 'judge', 'assistant')),
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tournament_id, judge_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_judge_assignments_tournament ON judge_assignments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_judge_assignments_judge ON judge_assignments(judge_id);

-- =====================================================
-- 4. TABLA DE CERTIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS judge_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  certification_level TEXT NOT NULL,
  certification_date DATE NOT NULL,
  expiry_date DATE,
  issued_by UUID REFERENCES profiles(id),
  certificate_number TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_judge_certifications_judge ON judge_certifications(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_certifications_game ON judge_certifications(game_type);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE judge_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_certifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA judge_applications
-- =====================================================

-- Usuarios autenticados pueden crear aplicaciones
DROP POLICY IF EXISTS "Users can create judge applications" ON judge_applications;
CREATE POLICY "Users can create judge applications"
  ON judge_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

-- Usuarios pueden ver sus propias aplicaciones
DROP POLICY IF EXISTS "Users can view own applications" ON judge_applications;
CREATE POLICY "Users can view own applications"
  ON judge_applications FOR SELECT
  USING (auth.uid() = applicant_id);

-- Head Judge puede ver todas las aplicaciones
DROP POLICY IF EXISTS "Head judge can view all applications" ON judge_applications;
CREATE POLICY "Head judge can view all applications"
  ON judge_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.judge_role = 'head_judge'
      AND profiles.judge_status = 'approved'
    )
  );

-- Head Judge puede actualizar aplicaciones
DROP POLICY IF EXISTS "Head judge can update applications" ON judge_applications;
CREATE POLICY "Head judge can update applications"
  ON judge_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.judge_role = 'head_judge'
      AND profiles.judge_status = 'approved'
    )
  );

-- =====================================================
-- POLÍTICAS PARA judge_assignments
-- =====================================================

-- Cualquiera puede ver asignaciones
DROP POLICY IF EXISTS "Anyone can view judge assignments" ON judge_assignments;
CREATE POLICY "Anyone can view judge assignments"
  ON judge_assignments FOR SELECT
  USING (true);

-- Head Judge y admins pueden crear asignaciones
DROP POLICY IF EXISTS "Head judge can create assignments" ON judge_assignments;
CREATE POLICY "Head judge can create assignments"
  ON judge_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.judge_role = 'head_judge' OR profiles.role = 'admin')
      AND profiles.judge_status = 'approved'
    )
  );

-- =====================================================
-- POLÍTICAS PARA judge_certifications
-- =====================================================

-- Cualquiera puede ver certificaciones
DROP POLICY IF EXISTS "Anyone can view certifications" ON judge_certifications;
CREATE POLICY "Anyone can view certifications"
  ON judge_certifications FOR SELECT
  USING (true);

-- Head Judge puede crear certificaciones
DROP POLICY IF EXISTS "Head judge can create certifications" ON judge_certifications;
CREATE POLICY "Head judge can create certifications"
  ON judge_certifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.judge_role = 'head_judge'
      AND profiles.judge_status = 'approved'
    )
  );

-- =====================================================
-- 6. FUNCIONES AUXILIARES
-- =====================================================

-- Función para aprobar una aplicación de juez
CREATE OR REPLACE FUNCTION approve_judge_application(
  application_id UUID,
  reviewer_id UUID,
  notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_applicant_id UUID;
  v_game_type TEXT;
  v_requested_level TEXT;
BEGIN
  -- Obtener datos de la aplicación
  SELECT applicant_id, game_type, requested_level
  INTO v_applicant_id, v_game_type, v_requested_level
  FROM judge_applications
  WHERE id = application_id;

  -- Actualizar aplicación
  UPDATE judge_applications
  SET 
    status = 'approved',
    reviewed_by = reviewer_id,
    review_notes = notes,
    updated_at = NOW()
  WHERE id = application_id;

  -- Actualizar perfil del juez
  UPDATE profiles
  SET 
    judge_role = 'judge',
    judge_status = 'approved',
    judge_level = v_requested_level,
    judge_certification_date = NOW()
  WHERE id = v_applicant_id;

  -- Crear certificación
  INSERT INTO judge_certifications (
    judge_id,
    game_type,
    certification_level,
    certification_date,
    issued_by,
    certificate_number
  ) VALUES (
    v_applicant_id,
    v_game_type,
    v_requested_level,
    NOW(),
    reviewer_id,
    'CERT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para rechazar una aplicación
CREATE OR REPLACE FUNCTION reject_judge_application(
  application_id UUID,
  reviewer_id UUID,
  notes TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE judge_applications
  SET 
    status = 'rejected',
    reviewed_by = reviewer_id,
    review_notes = notes,
    updated_at = NOW()
  WHERE id = application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. GRANTS
-- =====================================================

GRANT SELECT ON judge_applications TO authenticated;
GRANT INSERT ON judge_applications TO authenticated;
GRANT SELECT ON judge_assignments TO authenticated;
GRANT SELECT ON judge_certifications TO authenticated;

-- =====================================================
-- 8. CONFIGURACIÓN INICIAL (OPCIONAL)
-- =====================================================

-- Descomentar y ejecutar para asignar tu cuenta como Head Judge
/*
UPDATE profiles 
SET 
  judge_role = 'head_judge',
  judge_status = 'approved',
  judge_level = 'head',
  judge_certification_date = NOW(),
  judge_bio = 'Líder del programa de jueces de ThePlayer.gg',
  judge_specialties = ARRAY['mtg', 'pokemon'],
  judge_region = 'Metropolitana'
WHERE email = 'ni.tejias@profesor.duoc.cl';
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
