-- =====================================================
-- FIX ROLE FOR ALEXANDER GHIO
-- =====================================================

UPDATE profiles 
SET 
    role = 'player',
    is_content_creator = false
WHERE 
    (first_name ILIKE 'Alexander' AND last_name ILIKE 'Ghio')
    OR username ILIKE 'Alexander Ghio';

-- Verificar cambio
SELECT id, username, role, is_content_creator 
FROM profiles 
WHERE username ILIKE '%Ghio%' OR first_name ILIKE '%Alexander%';
