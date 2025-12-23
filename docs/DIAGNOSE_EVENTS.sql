-- =============================================================================
-- SCRIPT DE DIAGNÓSTICO: Verificar eventos agendados
-- =============================================================================

-- 1. Ver TODOS los eventos agendados (sin filtro de fecha)
SELECT 
    id,
    title,
    date,
    time,
    store_name,
    created_at
FROM public.scheduled_events
ORDER BY date ASC, time ASC;

-- 2. Ver la fecha actual del servidor
SELECT 
    CURRENT_DATE as fecha_servidor,
    (CURRENT_DATE AT TIME ZONE 'America/Santiago')::date as fecha_chile,
    NOW() as timestamp_servidor,
    NOW() AT TIME ZONE 'America/Santiago' as timestamp_chile;

-- 3. Ver eventos que coinciden con el filtro actual
SELECT 
    id,
    title,
    date,
    time,
    store_name,
    (date >= CURRENT_DATE) as cumple_filtro_basico,
    (date >= (CURRENT_DATE AT TIME ZONE 'America/Santiago')::date) as cumple_filtro_chile
FROM public.scheduled_events
ORDER BY date ASC;

-- 4. Buscar específicamente el evento "Pio - Martes"
SELECT 
    id,
    title,
    date,
    time,
    store_name,
    format,
    max_players,
    created_by
FROM public.scheduled_events
WHERE title LIKE '%Pio%' OR title LIKE '%Martes%'
ORDER BY date ASC;

-- 5. Contar eventos por fecha
SELECT 
    date,
    COUNT(*) as cantidad_eventos
FROM public.scheduled_events
GROUP BY date
ORDER BY date ASC;
