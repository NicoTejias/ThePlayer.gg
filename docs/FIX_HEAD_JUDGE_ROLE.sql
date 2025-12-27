-- Restaurar rol de Head Judge y arreglar función

-- 1. Restaurar tu rol de Head Judge
UPDATE profiles 
SET 
  judge_role = 'head_judge',
  judge_status = 'approved',
  judge_level = 'head'
WHERE email = 'nicolas.tejias@gmail.com';

-- 2. Arreglar función para que no sobrescriba Head Judges
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

  -- Actualizar perfil del juez (preservando head_judge)
  UPDATE profiles
  SET 
    judge_role = CASE 
      WHEN judge_role = 'head_judge' THEN 'head_judge'
      ELSE 'judge'
    END,
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
