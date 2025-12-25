import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface StatsByFormat {
    format: string;
    total_matches: number;
    wins: number;
    losses: number;
    draws: number;
    win_rate: number;
    total_pwp: number;
}

interface PWPProgression {
    tournament_date: string;
    tournament_name: string;
    format: string;
    pwp_earned: number;
    cumulative_pwp: number;
}

interface PerformanceMetrics {
    total_tournaments: number;
    total_pwp: number;
    average_pwp_per_tournament: number;
    best_format: string | null;
    worst_format: string | null;
    total_wins: number;
    total_losses: number;
    total_draws: number;
    overall_win_rate: number;
}

const PlayerStatsPage: React.FC = () => {
    const [statsByFormat, setStatsByFormat] = useState<StatsByFormat[]>([]);
    const [pwpProgression, setPwpProgression] = useState<PWPProgression[]>([]);
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchAllStats();
        }
    }, [currentUser]);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };

    const fetchAllStats = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            // Fetch stats by format
            const { data: formatData, error: formatError } = await supabase.rpc('get_player_stats_by_format', {
                p_player_id: currentUser.id
            });
            if (formatError) throw formatError;
            setStatsByFormat(formatData || []);

            // Fetch PWP progression
            const { data: progressionData, error: progressionError } = await supabase.rpc('get_player_pwp_progression', {
                p_player_id: currentUser.id
            });
            if (progressionError) throw progressionError;
            setPwpProgression(progressionData || []);

            // Fetch performance metrics
            const { data: metricsData, error: metricsError } = await supabase.rpc('get_player_performance_metrics', {
                p_player_id: currentUser.id
            });
            if (metricsError) throw metricsError;
            setMetrics(metricsData && metricsData.length > 0 ? metricsData[0] : null);

        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Error al cargar estadísticas');
        } finally {
            setLoading(false);
        }
    };

    const COLORS = {
        primary: '#0ea5e9',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        purple: '#a855f7',
    };

    const PIE_COLORS = [COLORS.success, COLORS.danger, COLORS.warning];

    const getWinRateColor = (winRate: number) => {
        if (winRate >= 60) return COLORS.success;
        if (winRate >= 40) return COLORS.warning;
        return COLORS.danger;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    if (!metrics || metrics.total_tournaments === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">Estadísticas</h1>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
                        <svg className="w-24 h-24 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h2 className="text-2xl font-bold mb-2">No hay estadísticas disponibles</h2>
                        <p className="text-slate-400">Participa en torneos para ver tus estadísticas aquí</p>
                    </div>
                </div>
            </div>
        );
    }

    const pieData = [
        { name: 'Victorias', value: metrics.total_wins },
        { name: 'Derrotas', value: metrics.total_losses },
        { name: 'Empates', value: metrics.total_draws }
    ].filter(item => item.value > 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Estadísticas Avanzadas</h1>
                    <p className="text-slate-400">Análisis detallado de tu rendimiento en torneos</p>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-sky-900/50 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <span className="text-slate-400 text-sm">Torneos</span>
                        </div>
                        <p className="text-3xl font-bold">{metrics.total_tournaments}</p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="text-slate-400 text-sm">PWP Total</span>
                        </div>
                        <p className="text-3xl font-bold">{metrics.total_pwp}</p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-slate-400 text-sm">Win Rate</span>
                        </div>
                        <p className="text-3xl font-bold">{metrics.overall_win_rate.toFixed(1)}%</p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-amber-900/50 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <span className="text-slate-400 text-sm">Promedio PWP</span>
                        </div>
                        <p className="text-3xl font-bold">{metrics.average_pwp_per_tournament.toFixed(1)}</p>
                    </div>
                </div>

                {/* Best/Worst Formats */}
                {(metrics.best_format || metrics.worst_format) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {metrics.best_format && (
                            <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-700/50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-2 text-green-400">🏆 Mejor Formato</h3>
                                <p className="text-2xl font-bold">{metrics.best_format}</p>
                            </div>
                        )}
                        {metrics.worst_format && (
                            <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-700/50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-2 text-red-400">📉 Formato a Mejorar</h3>
                                <p className="text-2xl font-bold">{metrics.worst_format}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* PWP Progression */}
                    {pwpProgression.length > 0 && (
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <h2 className="text-2xl font-bold mb-4">Progresión de PWP</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={pwpProgression}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis
                                        dataKey="tournament_date"
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8' }}
                                    />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                        labelStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="cumulative_pwp"
                                        stroke={COLORS.primary}
                                        strokeWidth={2}
                                        name="PWP Acumulado"
                                        dot={{ fill: COLORS.primary, r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Results Distribution */}
                    {pieData.length > 0 && (
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <h2 className="text-2xl font-bold mb-4">Distribución de Resultados</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Win Rate by Format */}
                {statsByFormat.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
                        <h2 className="text-2xl font-bold mb-4">Win Rate por Formato</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statsByFormat} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                <YAxis dataKey="format" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                />
                                <Bar dataKey="win_rate" name="Win Rate (%)" radius={[0, 8, 8, 0]}>
                                    {statsByFormat.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getWinRateColor(entry.win_rate)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Stats Table */}
                {statsByFormat.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-4">Estadísticas Detalladas por Formato</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">Formato</th>
                                        <th className="text-center py-3 px-4 text-slate-400 font-semibold">Partidas</th>
                                        <th className="text-center py-3 px-4 text-slate-400 font-semibold">W-L-D</th>
                                        <th className="text-center py-3 px-4 text-slate-400 font-semibold">Win Rate</th>
                                        <th className="text-center py-3 px-4 text-slate-400 font-semibold">PWP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statsByFormat.map((stat, index) => (
                                        <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                            <td className="py-3 px-4 font-semibold">{stat.format}</td>
                                            <td className="py-3 px-4 text-center">{stat.total_matches}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="text-green-400">{stat.wins}</span>-
                                                <span className="text-red-400">{stat.losses}</span>-
                                                <span className="text-yellow-400">{stat.draws}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className="px-3 py-1 rounded-full font-semibold"
                                                    style={{
                                                        backgroundColor: `${getWinRateColor(stat.win_rate)}20`,
                                                        color: getWinRateColor(stat.win_rate)
                                                    }}
                                                >
                                                    {stat.win_rate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-purple-400">{stat.total_pwp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerStatsPage;
