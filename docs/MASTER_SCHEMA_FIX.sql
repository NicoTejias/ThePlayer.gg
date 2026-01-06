-- =============================================================================
-- MASTER FIX - DATABASE SCHEMA & MISSING COLUMNS
-- =============================================================================

DO $$ 
BEGIN
    -- 1. Asegurar columnas básicas de estadísticas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='pwp') THEN
        ALTER TABLE profiles ADD COLUMN pwp INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='matches_won') THEN
        ALTER TABLE profiles ADD COLUMN matches_won INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='matches_lost') THEN
        ALTER TABLE profiles ADD COLUMN matches_lost INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='matches_drew') THEN
        ALTER TABLE profiles ADD COLUMN matches_drew INTEGER DEFAULT 0;
    END IF;

    -- 2. Asegurar columnas de PRO
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_pro') THEN
        ALTER TABLE profiles ADD COLUMN is_pro BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='pro_expires_at') THEN
        ALTER TABLE profiles ADD COLUMN pro_expires_at TIMESTAMP;
    END IF;

    -- 3. Asegurar columnas de visibilidad/equipos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_public') THEN
        ALTER TABLE profiles ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='team_id') THEN
        ALTER TABLE profiles ADD COLUMN team_id UUID REFERENCES teams(id);
    END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='team') THEN
        ALTER TABLE profiles ADD COLUMN team TEXT;
    END IF;

    RAISE NOTICE '✅ Esquema de base de datos verificado y corregido.';
END $$;

-- 4. Volver a aplicar permisos RLS para estar seguros
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
GRANT SELECT ON profiles TO anon, authenticated;

-- 5. Notificar
NOTIFY pgrst, 'reload config';
