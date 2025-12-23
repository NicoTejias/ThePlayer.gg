-- =============================================================================
-- ELIMINAR EVENTOS DUPLICADOS Y DE PRUEBA
-- =============================================================================

-- OPCIÓN 1: Eliminar TODOS los eventos agendados
-- (Usa esta si quieres empezar desde cero)
DELETE FROM public.scheduled_events;

-- OPCIÓN 2: Eliminar solo eventos duplicados del 2025-12-23
-- (Mantiene solo 1 de cada evento duplicado)
/*
DELETE FROM public.scheduled_events
WHERE id NOT IN (
    SELECT MIN(id)
    FROM public.scheduled_events
    WHERE date = '2025-12-23'
    GROUP BY title, time, store_name
);
*/

-- OPCIÓN 3: Eliminar solo eventos de "Tienda Test"
-- (Si todos los eventos de prueba son de esta tienda)
/*
DELETE FROM public.scheduled_events
WHERE store_name = 'Tienda Test';
*/

-- OPCIÓN 4: Eliminar eventos específicos del 2025-12-23
-- (Elimina todos los eventos de esa fecha)
/*
DELETE FROM public.scheduled_events
WHERE date = '2025-12-23';
*/

-- Verificar cuántos eventos quedan
SELECT 
    date,
    title,
    store_name,
    COUNT(*) as cantidad
FROM scheduled_events
GROUP BY date, title, store_name
ORDER BY date, title;

-- Ver total de eventos
SELECT COUNT(*) as total_eventos FROM scheduled_events;
