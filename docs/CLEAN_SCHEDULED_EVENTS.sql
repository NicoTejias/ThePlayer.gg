-- =============================================================================
-- LIMPIAR EVENTOS DUPLICADOS Y DE PRUEBA
-- =============================================================================

-- Opción 1: Eliminar TODOS los eventos agendados
DELETE FROM public.scheduled_events;

-- Opción 2: Eliminar solo eventos duplicados (mismo título, fecha, tienda)
-- Mantiene solo el primer evento de cada grupo duplicado
DELETE FROM public.scheduled_events
WHERE id NOT IN (
    SELECT MIN(id)
    FROM public.scheduled_events
    GROUP BY title, date, store_name
);

-- Verificar resultados
SELECT 
    title,
    date,
    store_name,
    COUNT(*) as cantidad
FROM scheduled_events
GROUP BY title, date, store_name
ORDER BY date;

-- Ver total de eventos
SELECT COUNT(*) as total_eventos FROM scheduled_events;
