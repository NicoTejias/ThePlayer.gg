-- =============================================================================
-- CORRECCIÓN PUNTUAL: reclasificar torneo como Premodern
-- =============================================================================
-- El torneo "Premier - 2026-06-09" (tienda NicoTejias) se subió con formato
-- "Premier" pero en realidad era de Premodern. Lo corregimos para que aparezca
-- bajo el filtro de formato "Premodern" en el ranking.
-- =============================================================================

UPDATE public.tournaments
SET format = 'Premodern'
WHERE id = 'e69293e9-69ba-45ec-b6a1-ae2fbaa183c6';

-- Verificar el cambio
SELECT id, name, format, store_name, date
FROM public.tournaments
WHERE id = 'e69293e9-69ba-45ec-b6a1-ae2fbaa183c6';
