import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { TournamentResult, CommunityEvent, PlayerProfile, Team } from '../types';

export const useAppData = (currentGame: string, userId: string | undefined) => {
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>([]);
    const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
    const [players, setPlayers] = useState<PlayerProfile[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);

    const fetchData = useCallback(async () => {
        setIsDataLoading(true);
        try {
            const [teamsRes, rankingRes, tourneysRes, eventsRes] = await Promise.all([
                supabase.from('teams').select('*'),
                supabase.rpc('get_game_ranking', { p_game_type: currentGame }),
                supabase.from('tournaments').select('*').eq('game_type', currentGame).order('date', { ascending: false }).limit(20),
                supabase.rpc('get_scheduled_events_with_registrations', { p_game_type: currentGame })
            ]);

            const tMap: Record<string, Team> = {};
            if (teamsRes.data) {
                teamsRes.data.forEach((t: any) => tMap[t.id] = t);
                setTeams(teamsRes.data);
            }

            if (rankingRes.data) {
                setPlayers(rankingRes.data.map((p: any) => ({
                    ...p,
                    name: p.username || (p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : 'Jugador Sin Nombre'),
                    isPublic: true,
                    team_internal: p.team_id ? tMap[p.team_id]?.name || p.team : p.team,
                    points: p.pwp,
                    points_claimed: p.pwp,
                    is_active: true
                })));
            }

            const storesProfilesRes = await supabase.from('profiles').select('id, avatar_url').eq('role', 'store');
            const storeAvatars: Record<string, string> = {};
            if (storesProfilesRes.data) {
                storesProfilesRes.data.forEach(p => {
                    if (p.avatar_url) storeAvatars[p.id] = p.avatar_url;
                });
            }

            if (tourneysRes.data) setTournamentResults(tourneysRes.data);

            const myRegistrations = new Set<string>();
            if (userId) {
                const { data: regData } = await supabase.from('event_registrations').select('event_id').eq('player_id', userId);
                if (regData) regData.forEach(r => myRegistrations.add(r.event_id));
            }

            let rawEvents = eventsRes.data;
            if (eventsRes.error) {
                const [tableRes, countsRes] = await Promise.all([
                    supabase.from('scheduled_events').select('*').eq('game_type', currentGame),
                    supabase.from('event_registrations').select('event_id')
                ]);

                if (tableRes.data) {
                    const countMap: Record<string, number> = {};
                    countsRes.data?.forEach((r: any) => {
                        countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
                    });

                    rawEvents = tableRes.data.map(e => ({
                        ...e,
                        registration_count: countMap[e.id] || 0,
                        event_time: e.time,
                        is_user_registered: myRegistrations.has(e.id)
                    }));
                }
            } else if (rawEvents) {
                rawEvents = rawEvents.map((e: any) => ({
                    ...e,
                    is_user_registered: e.is_user_registered || myRegistrations.has(e.id)
                }));
            }

            if (rawEvents && rawEvents.length > 0) {
                const mappedEvents: CommunityEvent[] = rawEvents.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    storeName: e.store_name || e.storeName,
                    format: e.format,
                    playerCount: e.player_count || e.registration_count || e.playerCount || 0,
                    imageUrl: e.image_url || e.imageUrl || storeAvatars[e.created_by || e.createdBy],
                    createdBy: e.created_by || e.createdBy,
                    maxPlayers: e.max_players || e.maxPlayers,
                    time: e.event_time || e.time,
                    description: e.description,
                    isUserRegistered: Boolean(e.is_user_registered || e.isUserRegistered),
                    entryFee: e.entry_fee || e.entryFee,
                    gameType: e.game_type || e.gameType
                }));
                setCommunityEvents(mappedEvents);
            }
        } catch (error) {
            console.error("Data Fetch Error:", error);
        } finally {
            setIsDataLoading(false);
        }
    }, [currentGame, userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        isDataLoading,
        tournamentResults,
        communityEvents,
        players,
        teams,
        refreshData: fetchData
    };
};
