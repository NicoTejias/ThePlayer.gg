-- =====================================================
-- AUTOMATIZACIÓN: HILO DE FORO AL REPORTAR INFRACCIÓN
-- =====================================================

CREATE OR REPLACE FUNCTION create_infraction(
  p_player_name TEXT,
  p_player_id UUID DEFAULT NULL,
  p_tournament_id UUID DEFAULT NULL,
  p_infraction_type TEXT DEFAULT 'other',
  p_severity TEXT DEFAULT 'warning',
  p_description TEXT DEFAULT '',
  p_penalty_applied TEXT DEFAULT NULL,
  p_game_type TEXT DEFAULT 'mtg'
)
RETURNS UUID AS $$
DECLARE
  v_infraction_id UUID;
  v_thread_id UUID;
  v_thread_title TEXT;
  v_post_content TEXT;
  v_reporter_username TEXT;
BEGIN
  -- 1. Crear Infracción
  INSERT INTO infractions (
    player_name, player_id, tournament_id, reported_by,
    infraction_type, severity, description, penalty_applied, game_type
  ) VALUES (
    p_player_name, p_player_id, p_tournament_id, auth.uid(),
    p_infraction_type, p_severity, p_description, p_penalty_applied, p_game_type
  )
  RETURNING id INTO v_infraction_id;

  -- 2. Obtener username del juez (para el post)
  SELECT username INTO v_reporter_username FROM profiles WHERE id = auth.uid();

  -- 3. Preparar datos para el Hilo
  v_thread_title := 'Infracción: ' || p_player_name || ' - ' || INITCAP(REPLACE(p_infraction_type, '_', ' '));
  v_post_content := '**Reporte Automático de Infracción**' || E'\n\n' ||
                    '**Jugador:** ' || p_player_name || E'\n' ||
                    '**Infracción:** ' || p_infraction_type || E'\n' ||
                    '**Severidad:** ' || p_severity || E'\n' ||
                    '**Penalización:** ' || COALESCE(p_penalty_applied, 'N/A') || E'\n\n' ||
                    '**Descripción:**' || E'\n' || p_description || E'\n\n' ||
                    'Este hilo ha sido creado automáticamente para discusión entre jueces.';

  -- 4. Crear Hilo en el Foro (Categoría 'rulings')
  INSERT INTO judge_forum_threads (
    author_id, title, category
  ) VALUES (
    auth.uid(), v_thread_title, 'rulings'
  )
  RETURNING id INTO v_thread_id;

  -- 5. Crear Primer Post del Hilo
  INSERT INTO judge_forum_posts (
    thread_id, author_id, content
  ) VALUES (
    v_thread_id, auth.uid(), v_post_content
  );
  
  RETURN v_infraction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
