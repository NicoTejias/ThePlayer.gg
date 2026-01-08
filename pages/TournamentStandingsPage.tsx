import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { TournamentResult, TournamentStanding } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';

const TournamentStandingsPage: React.FC = () => {
    const { tournamentId } = useParams<{ tournamentId: string }>();
    const [tournament, setTournament] = useState<TournamentResult | null>(null);
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
                    // Check specifically for PGRST116 (0 rows) which means not found
                    if (tournamentError.code === 'PGRST116') {
                        throw new Error("No se encontró el torneo.");
                    }
                    throw tournamentError;
                }

                if (!tournamentData) throw new Error("Torneo no encontrado");

                const mappedTournament: TournamentResult = {
                    id: tournamentData.id,
                    name: tournamentData.name,
                    date: tournamentData.date,
                    storeName: tournamentData.store_name || 'Desconocido',
                    format: tournamentData.format || 'Otro',
                    playerCount: tournamentData.player_count || 0
                };
                setTournament(mappedTournament);

                // 2. Fetch Results/Standings
                const { data: resultsData, error: resultsError } = await supabase
                    .from('tournament_results')
                    .select('*')
                    .eq('tournament_id', tournamentId)
                    .order('rank', { ascending: true });

                if (resultsError) throw resultsError;

                const mappedStandings: TournamentStanding[] = (resultsData || []).map((r, index) => ({
                    rank: r.rank || index + 1,
                    // Si no tiene player_id, es porque no está registrado en la base de datos como usuario
                    playerName: r.player_id ? r.player_name : 'Anónimo',
                    matchRecord: `${r.wins}-${r.losses}-${r.draws}`,
                    pwpEarned: r.pwp_earned
                }));

                setStandings(mappedStandings);

            } catch (err: any) {
                console.error("Error fetching tournament details:", err);
                setError(err.message || "Error al cargar la información del torneo.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tournamentId]);

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
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Puesto</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jugador</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Resultado (V-D-E)</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Puntos PLS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {standings.length > 0 ? (
                            standings.map((player, index) => (
                                <tr key={index} className={`transition-colors duration-150 ${index < 8 ? 'bg-sky-900/20 hover:bg-sky-800/30' : 'hover:bg-slate-700/40'}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-lg font-bold w-8 text-center inline-block ${player.rank === 1 ? 'text-yellow-400' :
                                            player.rank === 2 ? 'text-gray-300' :
                                                player.rank === 3 ? 'text-yellow-600' : 'text-slate-400'
                                            }`}>{player.rank}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{player.playerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-300 font-mono">{player.matchRecord}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-sky-400">
                                        <div className="flex items-center justify-end space-x-2">
                                            <span>{player.pwpEarned} pts</span>
                                            <TrophyIcon className="w-5 h-5 text-sky-500/70" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
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
