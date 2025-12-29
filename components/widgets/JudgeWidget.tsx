import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

interface JudgeWidgetProps {
    judgeId: string;
}

const JudgeWidget: React.FC<JudgeWidgetProps> = ({ judgeId }) => {
    const [judgeData, setJudgeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJudgeData = async () => {
            try {
                // Get judge profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', judgeId)
                    .single();

                // Get judge assignments (upcoming tournaments where they're assigned)
                const { data: assignments } = await supabase
                    .from('judge_assignments')
                    .select('tournament_id, role, tournaments(title, date, store_name)')
                    .eq('judge_id', judgeId)
                    .gte('tournaments.date', new Date().toISOString())
                    .order('tournaments.date', { ascending: true })
                    .limit(3);

                // Get pending discipline cases (if head judge)
                const { count: pendingCases } = await supabase
                    .from('discipline_cases')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'under_review');

                // Get tournaments needing judges
                const { data: tournamentsNeedingJudges } = await supabase
                    .from('tournaments')
                    .select('id, title, date, store_name')
                    .gte('date', new Date().toISOString())
                    .order('date', { ascending: true })
                    .limit(5);

                // Filter tournaments that don't have enough judges
                const tournamentsWithJudgeCount = await Promise.all(
                    (tournamentsNeedingJudges || []).map(async (tournament) => {
                        const { count } = await supabase
                            .from('judge_assignments')
                            .select('*', { count: 'exact', head: true })
                            .eq('tournament_id', tournament.id);

                        return { ...tournament, judgeCount: count || 0 };
                    })
                );

                const needingJudges = tournamentsWithJudgeCount.filter(t => t.judgeCount < 2);

                setJudgeData({
                    profile,
                    assignments: assignments || [],
                    pendingCases: pendingCases || 0,
                    tournamentsNeedingJudges: needingJudges.slice(0, 3)
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching judge data:', error);
                setLoading(false);
            }
        };

        fetchJudgeData();
    }, [judgeId]);

    if (loading) {
        return (
            <div className="bg-slate-800/30 border-y border-slate-700/50 py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    const { profile, assignments, pendingCases, tournamentsNeedingJudges } = judgeData || {};
    const isHeadJudge = profile?.role === 'head_judge';

    return (
        <div className="bg-gradient-to-r from-purple-900/10 via-slate-900/20 to-indigo-900/10 border-y border-slate-700/50 py-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">

                    {/* Judge Info Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">⚖️</span> Panel de Juez
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Nivel</span>
                                <span className="text-lg font-bold text-purple-400">{profile?.judge_level || 'L1'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Asignaciones</span>
                                <span className="text-2xl font-black text-green-400 font-mono">{assignments.length}</span>
                            </div>
                            {isHeadJudge && (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Casos Pendientes</span>
                                    <span className="text-xl font-bold text-yellow-400">{pendingCases}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-slate-700">
                                <Link to="/jueces" className="text-sky-400 hover:text-sky-300 text-sm font-bold flex items-center gap-1">
                                    Panel Completo →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Assignments Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📅</span> Tus Asignaciones
                        </h3>
                        {assignments.length > 0 ? (
                            <div className="space-y-2">
                                {assignments.slice(0, 2).map((assignment: any, idx: number) => (
                                    <div key={idx} className="text-sm">
                                        <p className="text-white font-bold line-clamp-1">{assignment.tournaments?.title}</p>
                                        <p className="text-slate-400 text-xs">
                                            {new Date(assignment.tournaments?.date).toLocaleDateString()} • {assignment.role}
                                        </p>
                                    </div>
                                ))}
                                <Link to="/jueces/asignaciones" className="text-sky-400 hover:text-sky-300 text-sm font-bold flex items-center gap-1 pt-2">
                                    Ver Todas →
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-500 text-sm">Sin asignaciones próximas</p>
                            </div>
                        )}
                    </div>

                    {/* Tournaments Needing Judges Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">🔔</span> Eventos Disponibles
                        </h3>
                        {tournamentsNeedingJudges.length > 0 ? (
                            <div className="space-y-2">
                                {tournamentsNeedingJudges.slice(0, 2).map((tournament: any) => (
                                    <div key={tournament.id} className="text-sm p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                                        <p className="text-white font-bold line-clamp-1">{tournament.title}</p>
                                        <p className="text-slate-400 text-xs">
                                            {new Date(tournament.date).toLocaleDateString()} • Necesita jueces
                                        </p>
                                    </div>
                                ))}
                                <Link to="/eventos" className="text-sky-400 hover:text-sky-300 text-sm font-bold flex items-center gap-1 pt-2">
                                    Ver Más →
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-500 text-sm">No hay eventos disponibles</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Head Judge Quick Actions */}
                {isHeadJudge && pendingCases > 0 && (
                    <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">⚠️</span>
                                <div>
                                    <p className="text-white font-bold">Tienes {pendingCases} caso{pendingCases > 1 ? 's' : ''} pendiente{pendingCases > 1 ? 's' : ''} de revisión</p>
                                    <p className="text-slate-400 text-sm">Requiere tu atención como Head Judge</p>
                                </div>
                            </div>
                            <Link
                                to="/jueces/casos"
                                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-colors"
                            >
                                Revisar Casos
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JudgeWidget;
