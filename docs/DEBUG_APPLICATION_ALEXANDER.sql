-- =====================================================
-- DIAGNÓSTICO: Buscar solicitud de Alexander Ghio
-- =====================================================

-- 1. Identificar el ID del usuario
WITH target_user AS (
    SELECT id, username, email 
    FROM profiles 
    WHERE first_name || ' ' || last_name ILIKE '%Alexander Ghio%' 
       OR username ILIKE '%Alexander Ghio%'
       OR email ILIKE '%alexander%'
    LIMIT 1
)
-- 2. Buscar aplicaciones vinculadas a ese usuario
SELECT 
    cca.id as application_id,
    cca.applicant_id,
    p.username as applicant_name,
    cca.status,
    cca.created_at,
    cca.content_type
FROM content_creator_applications cca
JOIN profiles p ON p.id = cca.applicant_id
WHERE cca.applicant_id = (SELECT id FROM target_user)
   OR p.username ILIKE '%Alexander%'
   OR p.first_name ILIKE '%Alexander%';

-- 3. Verificar si hay aplicaciones huérfanas o recientes en general
SELECT 
    cca.id, 
    cca.applicant_id, 
    p.username, 
    cca.status, 
    cca.created_at 
FROM content_creator_applications cca
LEFT JOIN profiles p ON cca.applicant_id = p.id
ORDER BY cca.created_at DESC
LIMIT 5;
