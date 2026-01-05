-- DIAGNOSTICO: ¿Por qué no se sumaron los puntos de Patricio Roman?

-- 1. Buscar el resultado del torneo recién subido para "Patricio Roman"
-- Queremos ver si 'player_id' es NULL (no se vinculó) o si tiene un ID.
SELECT 
    tr.id as result_id,
    tr.tournament_id,
    tr.player_name as name_in_tournament,
    tr.player_id as linked_profile_id,
    tr.pwp_earned,
    t.name as tournament_name,
    t.created_at
FROM tournament_results tr
JOIN tournaments t ON tr.tournament_id = t.id
WHERE tr.player_name ILIKE '%Patricio Roman%'
ORDER BY t.created_at DESC
LIMIT 5;

-- 2. Buscar si existe un perfil para "Patricio Roman" y ver sus datos
SELECT 
    id as profile_id, 
    username, 
    first_name, 
    last_name, 
    pwp as current_total_pwp
FROM profiles 
WHERE username ILIKE '%Patricio Roman%' 
   OR (first_name || ' ' || last_name) ILIKE '%Patricio Roman%';
