-- =============================================================================
-- LIMPIAR EVENTOS AGENDADOS DE PRUEBA
-- =============================================================================
-- Ejecuta esto para eliminar todos los eventos agendados y empezar de cero

DELETE FROM public.scheduled_events;

-- Verificar que quedó vacío
SELECT COUNT(*) as total_eventos FROM scheduled_events;
