import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

interface PlayerWidgetProps {
    userId: string;
}

const PlayerWidget: React.FC<PlayerWidgetProps> = ({ userId }) => {
    const [playerData, setPlayerData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayerData = async () => {
            try {
                // Get player profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                // Get player's upcoming events (tournaments they're registered for)
                const { data: registrations } = await supabase
                    .from('event_registrations')
                    .select('event_id, scheduled_events(title, date, store_name)')
                    .eq('player_id', userId)
                    .gte('scheduled_events.date', new Date().toISOString())
                    .order('scheduled_events.date', { ascending: true })
                    .limit(3);

                // Get recent tournament results
                const { data: recentResults } = await supabase
                    .from('tournament_results')
                    .select('placement, tournaments(title, date)')
                    .eq('player_id', userId)
                    .order('tournaments.date', { ascending: false })
                    .limit(3);

                setPlayerData({
                    profile,
                    upcomingEvents: registrations || [],
                    recentResults: recentResults || []
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching player data:', error);
                setLoading(false);
            }
        };

        fetchPlayerData();
    }, [userId]);

    if (loading) {
        return (
            <div className="bg-slate-800/30 border-y border-slate-700/50 py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    const { profile, upcomingEvents, recentResults } = playerData || {};

    return (
        <div className="bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-blue-900/10 border-y border-blue-500/20 py-8 md:py-10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">

                    {/* Player Stats Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📊</span> Tu Progreso
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Player Points</span>
                                <span className="text-2xl font-black text-green-400 font-mono">{profile?.pwp || 0}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-700">
                                <Link to="/perfil" className="text-sky-400 hover:text-sky-300 text-sm font-bold flex items-center gap-1">
                                    Ver Perfil Completo →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Events Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📅</span> Próximos Eventos
                        </h3>
                        {upcomingEvents.length > 0 ? (
                            <div className="space-y-2">
                                {upcomingEvents.slice(0, 2).map((reg: any, idx: number) => (
                                    <div key={idx} className="text-sm">
                                        <p className="text-white font-bold line-clamp-1">{reg.scheduled_events?.title}</p>
                                        <p className="text-slate-400 text-xs">
                                            {reg.scheduled_events?.date ? new Date(reg.scheduled_events.date).toLocaleDateString() : 'Fecha TBD'} • {reg.scheduled_events?.store_name}
                                        </p>
                                    </div>
                                ))}
                                <Link to="/eventos" className="text-sky-400 hover:text-sky-300 text-sm font-bold flex items-center gap-1 pt-2">
                                    Ver Todos →
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-500 text-sm mb-3">No tienes eventos próximos</p>
                                <Link to="/eventos" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors">
                                    Buscar Eventos
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Recent Results Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">🏆</span> Resultados Recientes
                        </h3>
                        {recentResults.length > 0 ? (
                            <div className="space-y-2">
                                {recentResults.slice(0, 2).map((result: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                                            <p className="text-white font-bold line-clamp-1">{result.tournaments?.title}</p>
                                            <p className="text-slate-400 text-xs">{new Date(result.tournaments?.date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-lg font-black ${result.placement <= 3 ? 'text-yellow-400' : 'text-slate-500'}`}>
                                            #{result.placement}
                                        </span>
                                    </div>
                                ))}
                                <Link to="/ranking" className="text-sky-400 hover:text-sky-300 text-sm font-bold flex items-center gap-1 pt-2">
                                    Ver Historial →
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-500 text-sm">Sin resultados aún</p>
                                <p className="text-slate-600 text-xs mt-1">¡Participa en tu primer torneo!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerWidget;
