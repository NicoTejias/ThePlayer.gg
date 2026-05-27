-- =============================================================================
-- TABLA: live_tournament_registrations
-- Permite a los jugadores registrarse en vivo escaneando un código QR
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.live_tournament_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(tournament_id, player_id)
);

-- Índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_live_registrations_tournament 
ON public.live_tournament_registrations (tournament_id);

CREATE INDEX IF NOT EXISTS idx_live_registrations_player 
ON public.live_tournament_registrations (player_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.live_tournament_registrations ENABLE ROW LEVEL SECURITY;

-- 1. Permiso de Lectura (Cualquiera puede consultar quién está inscrito)
CREATE POLICY "Anyone can view live registrations" 
ON public.live_tournament_registrations
FOR SELECT USING (true);

-- 2. Permiso de Inserción (Los jugadores autenticados se inscriben a sí mismos)
CREATE POLICY "Players can register themselves" 
ON public.live_tournament_registrations
FOR INSERT WITH CHECK (auth.uid() = player_id);

-- 3. Permiso de Eliminación (El jugador puede cancelar, o el TO puede limpiar la lista)
CREATE POLICY "Players or TOs can delete registrations" 
ON public.live_tournament_registrations
FOR DELETE USING (
    auth.uid() = player_id 
    OR EXISTS (
        SELECT 1 FROM public.tournaments t
        WHERE t.id = tournament_id 
        AND t.organizer_id = auth.uid()
    )
);

-- Notificar recargo de configuración
NOTIFY pgrst, 'reload config';
