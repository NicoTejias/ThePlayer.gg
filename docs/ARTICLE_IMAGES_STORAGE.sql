-- =====================================================
-- CONFIGURACIÓN DE SUPABASE STORAGE PARA IMÁGENES DE ARTÍCULOS
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Crear el bucket para imágenes de artículos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'article-images',
    'article-images',
    true,  -- Bucket público para que las imágenes sean accesibles
    5242880, -- 5MB límite por archivo
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Política para permitir a admins subir imágenes
CREATE POLICY "Admins can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'article-images'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'store', 'content_creator')
    )
);

-- 3. Política para permitir lectura pública de imágenes
CREATE POLICY "Public can view article images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-images');

-- 4. Política para permitir a admins eliminar imágenes
CREATE POLICY "Admins can delete article images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'article-images'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- 5. Política para permitir a admins actualizar imágenes
CREATE POLICY "Admins can update article images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'article-images'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Después de ejecutar, verifica que el bucket existe:
-- SELECT * FROM storage.buckets WHERE id = 'article-images';
