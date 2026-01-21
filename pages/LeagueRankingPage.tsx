import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Trophy, Calendar, Users, ArrowLeft, Store, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LeagueRanking {
    player_name: string;
    total_points: number;
    total_pwp: number;
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    tournaments_played: number;
}

interface LeagueDetails {
    id: string;
    name: string;
    format: string;
    created_at: string;
    store_id: string;
    status: string;
    description?: string;
    store?: {
        username: string;
    };
}

const LeagueRankingPage = () => {
    const { leagueId } = useParams<{ leagueId: string }>();
    const [ranking, setRanking] = useState<LeagueRanking[]>([]);
    const [league, setLeague] = useState<LeagueDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (data) setUserRole(data.role);
            }
        };
        fetchUserRole();
    }, []);

    useEffect(() => {
        const fetchLeagueData = async () => {
            if (!leagueId) return;

            try {
                setLoading(true);

                // Fetch League Details
                const { data: leagueData, error: leagueError } = await supabase
                    .from('store_leagues')
                    .select('*, store:profiles!store_leagues_store_id_fkey(username)') // Trying to join with profiles
                    .eq('id', leagueId)
                    .single();

                // Fallback if join fails or manual fetch needed
                if (!leagueData?.store && leagueData?.store_id) {
                    const { data: storeData } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', leagueData.store_id)
                        .single();
                    if (storeData) leagueData.store = storeData;
                }

                if (leagueError) throw leagueError;
                setLeague(leagueData);

                // Fetch Ranking
                const { data: rankingData, error: rankingError } = await supabase
                    .rpc('get_league_ranking', { p_league_id: leagueId });

                if (rankingError) throw rankingError;
                setRanking(rankingData);

            } catch (err: any) {
                console.error("Error fetching league data:", err);
                setError("No se pudo cargar la información de la liga.");
            } finally {
                setLoading(false);
            }
        };

        fetchLeagueData();
    }, [leagueId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    if (error || !league) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-slate-400">
                <Store className="w-16 h-16 mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-white mb-2">Liga no encontrada</h2>
                <p className="mb-6">{error || "La liga que buscas no existe o fue eliminada."}</p>
                <Link to="/" className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    Volver al Inicio
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-8">
                <Link
                    to={userRole === 'store' ? "/dashboard/tienda" : "/tiendas"}
                    className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {userRole === 'store' ? "Volver al Panel" : "Volver a Tiendas"}
                </Link>

                <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-wider border border-sky-500/20">
                                    {league.format}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${league.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                                    {league.status === 'active' ? 'En Curso' : 'Finalizada'}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{league.name}</h1>
                            <div className="flex items-center text-slate-400 gap-2">
                                <Store className="w-4 h-4" />
                                <span>Organizado por <span className="text-white font-medium">{league.store?.username || 'Tienda Desconocida'}</span></span>
                            </div>
                        </div>

                        <div className="flex gap-4 sm:gap-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">{ranking.length}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Jugadores</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">
                                    {league.status === 'active' ? 'Activa' : 'Finalizada'}
                                </div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Estado</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">
                                    {format(new Date(league.created_at), 'MMM yyyy', { locale: es })}
                                </div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Creada</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ranking Table - Main Content */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Tabla de Posiciones
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-800 text-slate-400 font-medium uppercase text-xs">
                                    <tr>
                                        <th className="px-3 sm:px-4 py-4 w-16 text-center">#</th>
                                        <th className="px-3 sm:px-4 py-4">Jugador</th>
                                        <th className="px-3 sm:px-4 py-4 text-center">Torneos</th>
                                        <th className="px-3 sm:px-4 py-4 text-center">W-L-D</th>
                                        <th className="px-3 sm:px-4 py-4 text-right">Pts Ranking</th>
                                        <th className="px-3 sm:px-4 py-4 text-right">Puntos Liga</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {ranking.map((player, index) => (
                                        <tr key={player.player_name} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-3 sm:px-4 py-4 text-center font-bold text-slate-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-3 sm:px-4 py-4 font-semibold text-white">
                                                {player.player_name}
                                            </td>
                                            <td className="px-3 sm:px-4 py-4 text-center text-slate-300">
                                                {player.tournaments_played}
                                            </td>
                                            <td className="px-3 sm:px-4 py-4 text-center text-slate-400 font-mono">
                                                <span className="text-green-400">{player.wins}</span>-
                                                <span className="text-red-400">{player.losses}</span>-
                                                <span className="text-yellow-400">{player.draws}</span>
                                            </td>
                                            <td className="px-3 sm:px-4 py-4 text-right font-medium text-slate-400">
                                                {Math.round(player.total_pwp)}
                                            </td>
                                            <td className="px-3 sm:px-4 py-4 text-right font-bold text-sky-400 text-lg">
                                                {player.total_points}
                                            </td>
                                        </tr>
                                    ))}
                                    {ranking.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-400">
                                                Aún no hay resultados registrados en esta liga.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeagueRankingPage;
