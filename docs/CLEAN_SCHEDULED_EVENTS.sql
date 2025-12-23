-- =============================================================================
-- ELIMINAR EVENTOS USANDO FUNCIONES RPC
-- =============================================================================
-- IMPORTANTE: Primero ejecuta ADMIN_DELETE_EVENTS_RPC.sql para crear las funciones

-- OPCIÓN 1: Eliminar TODOS los eventos agendados
-- Devuelve el número de eventos eliminados
SELECT public.delete_all_scheduled_events();

-- OPCIÓN 2: Eliminar solo eventos duplicados
-- Mantiene solo 1 de cada evento duplicado
-- SELECT public.delete_duplicate_events();

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
