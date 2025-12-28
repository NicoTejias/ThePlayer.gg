import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const AdminWidget: React.FC = () => {
    const [adminData, setAdminData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                // Get pending articles
                const { count: pendingArticles } = await supabase
                    .from('articles')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_published', false);

                // Get pending judge applications
                const { count: pendingJudges } = await supabase
                    .from('judge_applications')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');

                // Get pending discipline cases
                const { count: pendingCases } = await supabase
                    .from('discipline_cases')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'under_review');

                // Get growth metrics (last 7 days)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const { count: newPlayers } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'player')
                    .gte('created_at', sevenDaysAgo.toISOString());

                const { count: newTournaments } = await supabase
                    .from('tournaments')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', sevenDaysAgo.toISOString());

                setAdminData({
                    pendingArticles: pendingArticles || 0,
                    pendingJudges: pendingJudges || 0,
                    pendingCases: pendingCases || 0,
                    newPlayers: newPlayers || 0,
                    newTournaments: newTournaments || 0
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching admin data:', error);
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    if (loading) {
        return (
            <div className="bg-slate-800/30 border-y border-slate-700/50 py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    const { pendingArticles, pendingJudges, pendingCases, newPlayers, newTournaments } = adminData || {};
    const totalPending = pendingArticles + pendingJudges + pendingCases;

    return (
        <div className="bg-gradient-to-r from-red-900/10 via-slate-900/20 to-orange-900/10 border-y border-slate-700/50 py-8">
            <div className="container mx-auto px-4">

                {/* Alert Banner if there are pending items */}
                {totalPending > 0 && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🔔</span>
                                <div>
                                    <p className="text-white font-bold">Tienes {totalPending} elemento{totalPending > 1 ? 's' : ''} pendiente{totalPending > 1 ? 's' : ''} de revisión</p>
                                    <p className="text-slate-400 text-sm">Requiere tu atención como administrador</p>
                                </div>
                            </div>
                            <Link
                                to="/admin"
                                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
                            >
                                Panel Admin
                            </Link>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Pending Content Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Contenido Pendiente</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm">Artículos</span>
                                <span className={`text-xl font-black font-mono ${pendingArticles > 0 ? 'text-yellow-400' : 'text-slate-600'}`}>
                                    {pendingArticles}
                                </span>
                            </div>
                            <Link to="/admin/articulos" className="text-sky-400 hover:text-sky-300 text-xs font-bold flex items-center gap-1 pt-1">
                                Gestionar →
                            </Link>
                        </div>
                    </div>

                    {/* Pending Applications Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Solicitudes</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm">Jueces</span>
                                <span className={`text-xl font-black font-mono ${pendingJudges > 0 ? 'text-yellow-400' : 'text-slate-600'}`}>
                                    {pendingJudges}
                                </span>
                            </div>
                            <Link to="/admin/jueces" className="text-sky-400 hover:text-sky-300 text-xs font-bold flex items-center gap-1 pt-1">
                                Revisar →
                            </Link>
                        </div>
                    </div>

                    {/* Pending Cases Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Casos Disciplina</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm">En Revisión</span>
                                <span className={`text-xl font-black font-mono ${pendingCases > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                                    {pendingCases}
                                </span>
                            </div>
                            <Link to="/jueces/casos" className="text-sky-400 hover:text-sky-300 text-xs font-bold flex items-center gap-1 pt-1">
                                Ver Casos →
                            </Link>
                        </div>
                    </div>

                    {/* Growth Metrics Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Últimos 7 Días</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm">Nuevos Jugadores</span>
                                <span className="text-lg font-bold text-green-400">+{newPlayers}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm">Nuevos Torneos</span>
                                <span className="text-lg font-bold text-blue-400">+{newTournaments}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        to="/admin/articulos/nuevo"
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-center rounded-lg transition-colors"
                    >
                        ✍️ Nuevo Artículo
                    </Link>
                    <Link
                        to="/admin/videos/nuevo"
                        className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-center rounded-lg transition-colors"
                    >
                        🎥 Nuevo Video
                    </Link>
                    <Link
                        to="/admin/usuarios"
                        className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-center rounded-lg transition-colors"
                    >
                        👥 Usuarios
                    </Link>
                    <Link
                        to="/admin"
                        className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-center rounded-lg transition-colors"
                    >
                        ⚙️ Panel Admin
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminWidget;
