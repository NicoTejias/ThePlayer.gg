import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { TournamentResult, TournamentStanding } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';

interface TournamentStandingsProps {
    userRole?: 'player' | 'store' | 'admin' | null;
    userId?: string;
}

const TournamentStandingsPage: React.FC<TournamentStandingsProps> = ({ userRole, userId }) => {
    const { tournamentId } = useParams<{ tournamentId: string }>();
    const [tournament, setTournament] = useState<any | null>(null);
    const [standings, setStandings] = useState<TournamentStanding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!tournamentId) return;

            try {
                setLoading(true);
                setError(null);

                // 1. Fetch Tournament Details
                const { data: tournamentData, error: tournamentError } = await supabase
                    .from('tournaments')
                    .select('*')
                    .eq('id', tournamentId)
                    .single();

                if (tournamentError) {
                    if (tournamentError.code === 'PGRST116') {
                        throw new Error("No se encontró el torneo.");
                    }
                    throw tournamentError;
                }

                if (!tournamentData) throw new Error("Torneo no encontrado");

                // Map to TournamentResult but keep original data for permission checks
                const mappedTournament: TournamentResult & { organizer_id?: string, created_by?: string } = {
                    id: tournamentData.id,
                    name: tournamentData.name,
                    date: tournamentData.date,
                    storeName: tournamentData.store_name || 'Desconocido',
                    format: tournamentData.format || 'Otro',
                    playerCount: tournamentData.player_count || 0,
                    organizer_id: tournamentData.organizer_id,
                    created_by: tournamentData.created_by
                };
                setTournament(mappedTournament);

                // 2. Fetch Results/Standings
                const { data: resultsData, error: resultsError } = await supabase
                    .from('tournament_results')
                    .select(`
                        *,
                        profile:player_id (
                            id,
                            username,
                            first_name,
                            last_name
                        )
                    `)
                    .eq('tournament_id', tournamentId)
                    .order('rank', { ascending: true });

                if (resultsError) throw resultsError;

                // Helper to generate a consistent 4-digit ID for anonymous players
                const getAnonymousId = (str: string) => {
                    let hash = 0;
                    for (let i = 0; i < str.length; i++) {
                        hash = str.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    return Math.abs(hash % 9000) + 1000;
                };

                // Permission check variable (it needs to be updated after tournament fetch)
                const isAuthorized = userRole === 'admin' ||
                    (userRole === 'store' && tournamentData.organizer_id === userId) ||
                    (userRole === 'store' && tournamentData.created_by === userId);

                const mappedStandings: TournamentStanding[] = (resultsData || []).map((r: any, index: number) => {
                    // Determine name from profile (if registered) or raw field (if manual)
                    let finalName = r.player_name;
                    if (r.profile) {
                        finalName = r.profile.username ||
                            (r.profile.first_name ? `${r.profile.first_name} ${r.profile.last_name || ''}`.trim() : null) ||
                            finalName;
                    }

                    // Privacy Logic:
                    // 1. If the player has a profile (registered), show the name to everyone (accepted terms)
                    // 2. If no profile, mask the name UNLESS:
                    //    - Viewer is Admin
                    //    - Viewer is the Tournament Organizer
                    //    - Viewer IS the player (even if no profile, though unlikely to have player_id without profile)

                    const isRegistered = !!r.profile;
                    const isOwnResult = r.player_id && r.player_id === userId;

                    if (!isRegistered && !isAuthorized && !isOwnResult) {
                        const anonId = r.player_id ? getAnonymousId(r.player_id) : getAnonymousId(tournamentId + index);
                        finalName = `Jugador #${anonId}`;
                    }

                    if (!finalName) finalName = `Jugador ${getAnonymousId(tournamentId + index)}`;

                    return {
                        rank: r.rank || index + 1,
                        playerName: finalName,
                        pointsEarned: r.pwp_earned
                    };
                });

                setStandings(mappedStandings);

            } catch (err: any) {
                console.error("Error fetching tournament details:", err);
                setError(err.message || "Error al cargar la información del torneo.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tournamentId, userId, userRole]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Cargando resultados...</p>
            </div>
        );
    }

    if (error || !tournament) {
        return (
            <div className="text-center py-12">
                <h1 className="text-4xl font-bold text-white mb-4">Torneo no encontrado</h1>
                <p className="text-slate-400 mb-8">{error || "El torneo que buscas no existe o ha sido eliminado."}</p>
                <Link to="/torneos" className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-700 transition-colors">
                    Volver al Repositorio
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <Link to="/torneos" className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 mb-6 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Volver al Repositorio de Torneos
                </Link>
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">{tournament.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400">
                    <span>{tournament.date}</span>
                    <span className="hidden md:inline">|</span>
                    <span>Organizado por: <span className="font-semibold text-slate-300">{tournament.storeName}</span></span>
                    <span className="hidden md:inline">|</span>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-800 text-sky-200">{tournament.format}</span>
                    <span className="hidden md:inline">|</span>
                    <span>{tournament.playerCount} Jugadores</span>
                </div>
            </div>

            {/* Standings Table */}
            <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Puesto</th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jugador</th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {standings.length > 0 ? (
                            standings.map((player, index) => (
                                <tr key={index} className={`transition-colors duration-150 ${index < 8 ? 'bg-sky-900/20 hover:bg-sky-800/30' : 'hover:bg-slate-700/40'}`}>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm sm:text-lg font-bold w-8 text-center inline-block ${player.rank === 1 ? 'text-yellow-400' :
                                            player.rank === 2 ? 'text-gray-300' :
                                                player.rank === 3 ? 'text-yellow-600' : 'text-slate-400'
                                            }`}>{player.rank}</span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {player.playerName.startsWith('Jugador #') ? (
                                            <div className="flex items-center gap-2 group/anon">
                                                <span className="text-slate-500 font-mono italic bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/30">
                                                    {player.playerName}
                                                </span>
                                                <div className="relative">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-600 group-hover/anon:text-sky-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                    </svg>
                                                    {/* Tooltip on hover */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-[10px] text-slate-300 rounded opacity-0 group-hover/anon:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 z-30">
                                                        Regístrate para ver tu nombre
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-white">{player.playerName}</span>
                                        )}
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-sky-400">
                                        <div className="flex items-center justify-end space-x-2">
                                            <span>{player.pointsEarned}</span>
                                            <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500/70" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                                    No hay resultados registrados para este torneo.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TournamentStandingsPage;
