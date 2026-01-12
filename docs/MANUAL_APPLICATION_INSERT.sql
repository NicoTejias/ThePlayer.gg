-- =====================================================
-- INSERCIÓN MANUAL DE SOLICITUD DE CREADOR
-- =====================================================

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Obtener ID de Alexander Ghio
    SELECT id INTO v_user_id
    FROM profiles
    WHERE username ILIKE '%Alexander Ghio%' 
       OR (first_name ILIKE '%Alexander%' AND last_name ILIKE '%Ghio%')
    LIMIT 1;

    -- Validar que encontramos al usuario
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario Alexander Ghio no encontrado';
    END IF;

    -- 2. Insertar solicitud de creador (si no existe ya)
    IF NOT EXISTS (SELECT 1 FROM content_creator_applications WHERE applicant_id = v_user_id) THEN
        INSERT INTO content_creator_applications (
            applicant_id,
            portfolio_url,
            social_media_links,
            content_type,
            sample_work_urls,
            motivation,
            experience,
            status
        ) VALUES (
            v_user_id,
            'https://youtube.com/@StreamCasterMage', -- Portfolio genérico o link de su canal
            '{"youtube": "https://youtube.com/@StreamCasterMage", "instagram": "https://instagram.com/alexanderghio"}',
            ARRAY['video', 'live_stream'],
            ARRAY['https://youtube.com/watch?v=ejemplo'],
            'Solicitud generada manualmente por administración.',
            'Streamer activo de la comunidad.',
            'pending'
        );
    ELSE
        RAISE NOTICE 'El usuario ya tiene una solicitud registrada.';
    END IF;
END $$;
