DO $$
DECLARE
    v_pending_articles INTEGER;
    v_pending_judges INTEGER;
    v_pending_cases INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_pending_articles FROM articles WHERE is_published = false;
    SELECT COUNT(*) INTO v_pending_judges FROM judge_applications WHERE status = 'pending';
    SELECT COUNT(*) INTO v_pending_cases FROM discipline_cases WHERE status = 'under_review';

    RAISE NOTICE '=== PENDIENTES ===';
    RAISE NOTICE 'Artículos: %', v_pending_articles;
    RAISE NOTICE 'Jueces: %', v_pending_judges;
    RAISE NOTICE 'Casos: %', v_pending_cases;
END $$;
