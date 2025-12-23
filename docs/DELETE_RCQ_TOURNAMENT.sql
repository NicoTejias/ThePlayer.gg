-- =============================================================================
-- SCRIPT: Eliminar Torneo RCQ y Volver a Subir
-- =============================================================================

-- PASO 1: Ver todos los torneos recientes para identificar el RCQ
SELECT 
    id,
    tournament_name,
    tournament_date,
    store_name,
    player_count,
    format,
    created_at
FROM public.tournaments
ORDER BY created_at DESC
LIMIT 20;

-- =============================================================================
-- PASO 2: Una vez identificado el ID del torneo, ejecutar lo siguiente
-- REEMPLAZA 'ID_DEL_TORNEO_AQUI' con el ID real del torneo RCQ
-- =============================================================================

-- 2.1 - Ver cuántos resultados tiene el torneo (para verificar)
SELECT COUNT(*) as total_resultados
FROM public.tournament_results
WHERE tournament_id = 'ID_DEL_TORNEO_AQUI';

-- 2.2 - Eliminar los resultados del torneo
DELETE FROM public.tournament_results 
WHERE tournament_id = 'ID_DEL_TORNEO_AQUI';

-- 2.3 - Eliminar el torneo
DELETE FROM public.tournaments 
WHERE id = 'ID_DEL_TORNEO_AQUI';

-- 2.4 - Verificar que se eliminó correctamente
SELECT 
    id,
    tournament_name,
    tournament_date
FROM public.tournaments
WHERE id = 'ID_DEL_TORNEO_AQUI';
-- Esta query NO debería devolver ningún resultado

-- =============================================================================
-- PASO 3: Después de ejecutar este script
-- =============================================================================
-- 1. Ve al Dashboard de Tienda
-- 2. Sube el torneo de nuevo
-- 3. IMPORTANTE: Selecciona "RCQ (x4)" como tipo de torneo
-- 4. Verifica que los puntos se vean multiplicados por 4
-- 5. Confirma y sube
-- =============================================================================
