-- =============================================================================
-- FORCE RECALCULATE TRIGGER - ThePlayer.gg
-- Misión: Forzar el trigger manualmente para los registros de Patricio.
-- =============================================================================

DO $$
DECLARE
    v_updated INT;
BEGIN
    RAISE NOTICE '🔧 Forzando actualización de trigger para Patricio...';

    -- Simular una actualización "dummy" (cambiar wins a wins) para disparar el trigger
    -- en todos los resultados vinculados al perfil de Patricio.
    UPDATE tournament_results
    SET wins = wins
    WHERE player_id IN (
        SELECT id FROM profiles
        WHERE username ILIKE '%Patricio Roman%' OR (first_name || ' ' || last_name) ILIKE '%Patricio Roman%'
    );

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE '✅ Se actualizaron % filas, forzando el recálculo de puntos.', v_updated;

END $$;
