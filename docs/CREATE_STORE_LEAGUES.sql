-- ============================================================================
-- CREATE_STORE_LEAGUES.sql
-- Crea el sistema de Ligas de tienda que el frontend ya esperaba pero que
-- nunca se migró a la base de datos (por eso las ligas fallaban en silencio).
--
-- Seguro de correr varias veces: usa IF NOT EXISTS / OR REPLACE / DROP POLICY.
-- Ejecutar en: Supabase -> SQL Editor.
-- ============================================================================

-- 1) Tabla de ligas -----------------------------------------------------------
-- La FK store_id -> profiles(id) se auto-nombra "store_leagues_store_id_fkey",
-- que es exactamente el nombre que usan los joins del frontend.
create table if not exists public.store_leagues (
    id          uuid primary key default gen_random_uuid(),
    store_id    uuid not null references public.profiles(id) on delete cascade,
    name        text not null,
    format      text,
    is_private  boolean not null default false,
    status      text not null default 'active',   -- 'active' | 'finished'
    description text,
    created_at  timestamptz not null default now()
);

create index if not exists idx_store_leagues_store_id on public.store_leagues(store_id);

-- 2) Vincular torneos a una liga (opcional) -----------------------------------
alter table public.tournaments
    add column if not exists league_id uuid references public.store_leagues(id) on delete set null;

create index if not exists idx_tournaments_league_id on public.tournaments(league_id);

-- 3) Row Level Security -------------------------------------------------------
alter table public.store_leagues enable row level security;

-- Lectura: ligas públicas para todos; ligas privadas solo para su dueño.
drop policy if exists "store_leagues_select" on public.store_leagues;
create policy "store_leagues_select" on public.store_leagues
    for select
    using ( is_private = false or store_id = auth.uid() );

-- Escritura: solo el dueño (la tienda) gestiona sus propias ligas.
drop policy if exists "store_leagues_insert" on public.store_leagues;
create policy "store_leagues_insert" on public.store_leagues
    for insert
    with check ( store_id = auth.uid() );

drop policy if exists "store_leagues_update" on public.store_leagues;
create policy "store_leagues_update" on public.store_leagues
    for update
    using ( store_id = auth.uid() )
    with check ( store_id = auth.uid() );

drop policy if exists "store_leagues_delete" on public.store_leagues;
create policy "store_leagues_delete" on public.store_leagues
    for delete
    using ( store_id = auth.uid() );

-- 4) RPC de ranking de liga ---------------------------------------------------
-- Agrega los resultados de todos los torneos vinculados a la liga.
create or replace function public.get_league_ranking(p_league_id uuid)
returns table (
    player_name          text,
    total_points         integer,
    total_player_points  integer,
    matches_played       integer,
    wins                 integer,
    draws                integer,
    losses               integer,
    tournaments_played   integer
)
language sql
stable
as $$
    select
        tr.player_name,
        sum(tr.wins * 3 + tr.draws)::int            as total_points,
        sum(coalesce(tr.pwp_earned, 0))::int        as total_player_points,
        sum(tr.wins + tr.draws + tr.losses)::int    as matches_played,
        sum(tr.wins)::int                           as wins,
        sum(tr.draws)::int                          as draws,
        sum(tr.losses)::int                         as losses,
        count(distinct tr.tournament_id)::int       as tournaments_played
    from public.tournament_results tr
    join public.tournaments t on t.id = tr.tournament_id
    where t.league_id = p_league_id
    group by tr.player_name
    order by total_player_points desc, total_points desc;
$$;

grant execute on function public.get_league_ranking(uuid) to anon, authenticated;
