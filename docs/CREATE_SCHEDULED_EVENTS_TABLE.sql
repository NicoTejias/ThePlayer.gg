-- =============================================================================
-- TABLA: scheduled_events
-- Almacena eventos agendados (torneos futuros programados por tiendas)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    date date NOT NULL,
    time time NOT NULL,
    format text NOT NULL,
    store_name text NOT NULL,
    max_players integer DEFAULT 64,
    description text,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_scheduled_events_date 
ON public.scheduled_events (date);

CREATE INDEX IF NOT EXISTS idx_scheduled_events_store 
ON public.scheduled_events (store_name);

CREATE INDEX IF NOT EXISTS idx_scheduled_events_created_by 
ON public.scheduled_events (created_by);

-- =============================================================================
-- RLS Policies para scheduled_events
-- =============================================================================
ALTER TABLE public.scheduled_events ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view scheduled events" ON public.scheduled_events;
    DROP POLICY IF EXISTS "Stores and admins can create events" ON public.scheduled_events;
    DROP POLICY IF EXISTS "Users can update own events" ON public.scheduled_events;
    DROP POLICY IF EXISTS "Users can delete own events" ON public.scheduled_events;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Todos pueden ver eventos agendados
CREATE POLICY "Anyone can view scheduled events" ON public.scheduled_events
    FOR SELECT USING (true);

-- Solo tiendas y admins pueden crear eventos
CREATE POLICY "Stores and admins can create events" ON public.scheduled_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('store', 'admin')
        )
    );

-- Solo el creador puede actualizar sus eventos
CREATE POLICY "Users can update own events" ON public.scheduled_events
    FOR UPDATE USING (auth.uid() = created_by);

-- Solo el creador puede eliminar sus eventos
CREATE POLICY "Users can delete own events" ON public.scheduled_events
    FOR DELETE USING (auth.uid() = created_by);
