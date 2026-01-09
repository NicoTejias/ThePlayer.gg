-- ============================================================================
-- FIX: Permitir a Admins eliminar publicaciones del marketplace
-- ============================================================================

-- 1. Crear política para DELETE
CREATE POLICY "Admins can delete any listing"
ON public.marketplace_listings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. Crear política para UPDATE (por si acaso quisieran editar/ocultar)
CREATE POLICY "Admins can update any listing"
ON public.marketplace_listings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
