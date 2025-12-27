-- Asignar Nemesio Bolaños como Head Judge
-- Ejecutar DESPUÉS de que se registre en la plataforma

-- Opción 1: Si conoces su email exacto
UPDATE profiles 
SET 
  judge_role = 'head_judge',
  judge_status = 'approved',
  judge_level = 'level_3',
  judge_certification_date = NOW(),
  judge_bio = 'Juez Nivel 3 de Magic: The Gathering en Chile. Líder del programa de jueces de ThePlayer.gg',
  judge_specialties = ARRAY['mtg'],
  judge_region = 'Metropolitana'
WHERE email = 'email_de_nemesio@ejemplo.com'; -- REEMPLAZAR CON SU EMAIL REAL

-- Opción 2: Si conoces su username
UPDATE profiles 
SET 
  judge_role = 'head_judge',
  judge_status = 'approved',
  judge_level = 'level_3',
  judge_certification_date = NOW(),
  judge_bio = 'Juez Nivel 3 de Magic: The Gathering en Chile. Líder del programa de jueces de ThePlayer.gg',
  judge_specialties = ARRAY['mtg'],
  judge_region = 'Metropolitana'
WHERE username = 'Neme B.'; -- O el username que use al registrarse

-- Verificar que se aplicó correctamente
SELECT 
  username, 
  email, 
  judge_role, 
  judge_level, 
  judge_status,
  judge_bio
FROM profiles 
WHERE judge_role = 'head_judge';

-- NOTA: Pueden haber múltiples Head Judges en el sistema
-- Ambos (tú y Nemesio) pueden gestionar aplicaciones
