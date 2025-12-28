-- =====================================================
-- SISTEMA DE GESTIÓN DE CONTENIDOS (CMS)
-- =====================================================

-- 1. TABLA DE ARTÍCULOS
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL, -- Contenido en Markdown
  excerpt TEXT, -- Resumen corto
  image_url TEXT, -- URL de la imagen de portada
  author_id UUID REFERENCES profiles(id) NOT NULL,
  
  game_type TEXT NOT NULL DEFAULT 'general', -- mtg, pokemon, general, etc.
  category TEXT DEFAULT 'news', -- news, guide, opinion, coverage
  
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABLA DE VIDEOS
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_id TEXT NOT NULL, -- ID del video de YT (ej: dQw4w9WgXcQ)
  title TEXT NOT NULL,
  description TEXT,
  
  game_type TEXT NOT NULL DEFAULT 'general',
  is_featured BOOLEAN DEFAULT FALSE, -- Video destacado en home/sección
  
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP DEFAULT NOW() -- Para ordenar
);

-- 3. POLÍTICAS DE SEGURIDAD (RLS)

-- Habilitar RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- ARTÍCULOS -------------------------------------------

-- Lectura: Todos pueden ver artículos publicados
CREATE POLICY "Public articles are visible to everyone" ON articles
  FOR SELECT USING (is_published = TRUE);

-- Lectura Admin: Admins y Editores pueden ver todo (incluso borradores)
CREATE POLICY "Admins see all articles" ON articles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role IN ('admin', 'organizer')))
  );

-- Escritura: Solo Admins y Organizadores pueden crear/editar/borrar
CREATE POLICY "Admins can manage articles" ON articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role IN ('admin', 'organizer')))
  );

-- VIDEOS ----------------------------------------------

-- Lectura: Todos pueden ver videos
CREATE POLICY "Public videos are visible to everyone" ON videos
  FOR SELECT USING (TRUE);

-- Escritura: Solo Admins
CREATE POLICY "Admins can manage videos" ON videos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role IN ('admin', 'organizer')))
  );

-- 4. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_game ON articles(game_type);
CREATE INDEX IF NOT EXISTS idx_videos_game ON videos(game_type);

-- 5. GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON articles TO authenticated;
GRANT SELECT ON articles TO anon; -- Para ver noticias públicas sin login
GRANT SELECT, INSERT, UPDATE, DELETE ON videos TO authenticated;
GRANT SELECT ON videos TO anon;
