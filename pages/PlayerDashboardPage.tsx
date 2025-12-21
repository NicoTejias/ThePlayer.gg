import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { PlayerTournamentRecord, MarketplacePost } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number, rank: string | number, color: string }> = ({ icon, title, value, rank, color }) => (
    <div className={`bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-slate-400 uppercase">{title}</p>
                <p className={`text-3xl font-bold text-${color}-400`}>{value}</p>
            </div>
            <div className={`p-3 rounded-full bg-${color}-500/10 text-${color}-400`}>
                {icon}
            </div>
        </div>
        <p className="text-2xl font-bold text-white mt-2">Puesto #{rank}</p>
    </div>
);


const PlayerDashboardPage: React.FC<{ profile?: any }> = ({ profile }) => {
    const [tournamentHistory, setTournamentHistory] = useState<any[]>([]);
    const [ranking, setRanking] = useState<{ pwpRank: number; winRateRank: number }>({ pwpRank: 0, winRateRank: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.id) {
            fetchPlayerData();
        }
    }, [profile?.id]);

    const fetchPlayerData = async () => {
        setLoading(true);
        try {
            // 1. Fetch tournament history for this player
            const { data: tournamentResults } = await supabase
                .from('tournament_results')
                .select(`
                    *,
                    tournaments:tournament_id (
                        name,
                        date,
                        format
                    )
                `)
                .eq('player_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(10);

            setTournamentHistory(tournamentResults || []);

            // 2. Calculate PWP ranking
            const { data: allPlayers } = await supabase
                .from('profiles')
                .select('id, pwp')
                .order('pwp', { ascending: false });

            const pwpRank = (allPlayers?.findIndex(p => p.id === profile.id) || 0) + 1;

            setRanking({ pwpRank, winRateRank: 0 }); // Win rate ranking can be calculated similarly if needed

        } catch (error) {
            console.error("Error fetching player data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Determine greeting name: Prioritize First Name, then Username
    const greetingName = profile?.first_name || profile?.username || 'Jugador';

    // Calculate Win Rate
    const totalMatches = (profile?.matches_won || 0) + (profile?.matches_lost || 0) + (profile?.matches_drew || 0);
    const winRate = totalMatches > 0
        ? ((profile?.matches_won || 0) / totalMatches * 100).toFixed(1)
        : '0.0';

    // Marketplace posts - to be implemented
    const userPosts: any[] = [];

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Hola, {greetingName}</h1>
                <p className="text-lg text-slate-300 mt-2">
                    Bienvenido a tu panel. Aquí puedes ver tu progreso, historial de torneos y gestionar tus publicaciones.
                </p>
            </div>

            {/* Key Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                    icon={<TrophyIcon className="w-8 h-8" />}
                    title="Puntos PWP"
                    value={`${profile?.pwp || 0} pts`}
                    rank={ranking.pwpRank || '-'}
                    color="sky"
                />
                <StatCard
                    icon={<SparklesIcon className="w-8 h-8" />}
                    title="Win Rate Global"
                    value={`${winRate}%`}
                    rank={ranking.winRateRank || '-'}
                    color="violet"
                />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Tournament History */}
                <section>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Historial de Torneos</h2>
                    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Torneo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Resultado (V-D-E)</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Puntos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-slate-400">Cargando...</td>
                                    </tr>
                                ) : tournamentHistory.length > 0 ? (
                                    tournamentHistory.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-700/40">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-white">{t.tournaments?.name || 'Torneo'}</p>
                                                <p className="text-xs text-slate-400">{t.tournaments?.date || ''} - {t.tournaments?.format || ''}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                                                {t.wins}-{t.losses}-{t.draws}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-sky-400">+{t.pwp_earned} pts</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-slate-400">No hay torneos registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Marketplace Management */}
                <section>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Mis Publicaciones</h2>
                    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Publicación</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tipo</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {userPosts.length > 0 ? (
                                    userPosts.map(post => (
                                        <tr key={post.id} className="hover:bg-slate-700/40">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{post.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`font-semibold text-xs px-2 py-1 rounded-full ${post.type === 'Venta' ? 'bg-red-500/20 text-red-300' :
                                                    post.type === 'Compra' ? 'bg-green-500/20 text-green-300' :
                                                        'bg-blue-500/20 text-blue-300'
                                                    }`}>
                                                    {post.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                <button className="p-2 text-slate-400 hover:text-green-400 transition-colors" title="Marcar como Vendido/Completado">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-yellow-400 transition-colors" title="Editar">
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-slate-400">No tienes publicaciones activas.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default PlayerDashboardPage;
