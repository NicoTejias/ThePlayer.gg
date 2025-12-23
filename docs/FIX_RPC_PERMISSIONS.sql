-- =============================================================================
-- SCRIPT DE REPARACIÓN: Permisos de Ejecución para Funciones RPC
-- =============================================================================
-- Este script asegura que todos los usuarios autenticados (tiendas y admins)
-- tengan permiso para EJECUTAR las funciones necesarias.
-- =============================================================================

-- 1. Permisos para Crear Torneos (Upload)
GRANT EXECUTE ON FUNCTION public.create_tournament_via_rpc(uuid, text, date, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tournament_via_rpc(uuid, text, date, text, text, integer) TO service_role;

-- 2. Permisos para Procesar Resultados (Upload)
GRANT EXECUTE ON FUNCTION public.process_tournament_results_bulk(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_tournament_results_bulk(uuid, jsonb) TO service_role;

-- 3. Permisos para Eliminar Torneos
GRANT EXECUTE ON FUNCTION public.delete_tournament_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tournament_by_id(uuid) TO service_role;

-- 4. Permisos para Aprobar Tiendas (Solo Admins lo usarán, pero authenticated necesita poder llamar)
-- (La seguridad interna de la función protege quién puede hacer qué)
GRANT EXECUTE ON FUNCTION public.approve_store_rpc(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_store_rpc(uuid) TO service_role;

-- 5. Recargar la configuración de la API para aplicar cambios inmediatamente
NOTIFY pgrst, 'reload config';
