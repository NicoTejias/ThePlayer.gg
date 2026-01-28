-- =============================================================================
-- HERRAMIENTA DE UNIFICACIÓN DE PERFILES DUPLICADOS
-- Motivo: Usuarios que se registran por Email y luego por Google (o viceversa)
-- creando cuentas separadas con diferentes correos o IDs.
-- =============================================================================

/**
 * Función: merge_duplicate_profiles
 * Transfiere todos los datos de un "source_id" a un "target_id" y elimina el source.
 */
CREATE OR REPLACE FUNCTION public.merge_duplicate_profiles(
    p_source_id UUID,
    p_target_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_source_exists BOOLEAN;
    v_target_exists BOOLEAN;
    v_results_count INTEGER := 0;
    v_registrations_count INTEGER := 0;
BEGIN
    -- 1. Verificar existencia
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_source_id) INTO v_source_exists;
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_target_id) INTO v_target_exists;

    IF NOT v_source_exists THEN
        RETURN jsonb_build_object('success', false, 'message', 'El usuario origen no existe');
    END IF;
    IF NOT v_target_exists THEN
        RETURN jsonb_build_object('success', false, 'message', 'El usuario destino no existe');
    END IF;

    -- 2. Transferir Resultados de Torneos
    UPDATE tournament_results SET player_id = p_target_id WHERE player_id = p_source_id;
    GET DIAGNOSTICS v_results_count = ROW_COUNT;

    -- 3. Transferir Alias de Jugador
    -- NOTA: Podría haber conflictos si ambos tienen el mismo alias. Usamos ON CONFLICT DO NOTHING.
    INSERT INTO player_aliases (player_id, alias)
    SELECT p_target_id, alias FROM player_aliases WHERE player_id = p_source_id
    ON CONFLICT DO NOTHING;
    DELETE FROM player_aliases WHERE player_id = p_source_id;

    -- 4. Transferir Inscripciones a Eventos
    UPDATE event_registrations SET player_id = p_target_id WHERE player_id = p_source_id;
    GET DIAGNOSTICS v_registrations_count = ROW_COUNT;

    -- 5. Transferir Reclamaciones de Resultados
    UPDATE result_claims SET player_id = p_target_id WHERE player_id = p_source_id;

    -- 6. Transferir Notificaciones
    UPDATE notifications SET user_id = p_target_id WHERE user_id = p_source_id;

    -- 7. Transferir Favoritos y Preferencias
    UPDATE marketplace_favorites SET user_id = p_target_id WHERE user_id = p_source_id;
    UPDATE event_preferences SET user_id = p_target_id WHERE user_id = p_source_id;

    -- 8. Transferir Suscripciones (Si el destino no tiene una activa)
    UPDATE player_subscriptions 
    SET player_id = p_target_id 
    WHERE player_id = p_source_id 
    AND NOT EXISTS (SELECT 1 FROM player_subscriptions ps2 WHERE ps2.player_id = p_target_id AND ps2.status = 'active');

    -- 9. Transferir Premios/Awards
    UPDATE user_awards SET user_id = p_target_id WHERE user_id = p_source_id;

    -- 10. Transferir Foro (Threads y Posts)
    UPDATE forum_threads SET user_id = p_target_id WHERE user_id = p_source_id;
    UPDATE forum_posts SET user_id = p_target_id WHERE user_id = p_source_id;

    -- 11. Eliminar Perfil Origen
    DELETE FROM profiles WHERE id = p_source_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Fusión completada con éxito',
        'transferred_results', v_results_count,
        'transferred_registrations', v_registrations_count
    );
END;
$$;

-- Otorgar permisos solo a administradores (o roles autenticados si se desea auto-servicio controlado)
GRANT EXECUTE ON FUNCTION public.merge_duplicate_profiles(UUID, UUID) TO authenticated;
