import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

interface StoreWidgetProps {
    storeId: string;
}

const StoreWidget: React.FC<StoreWidgetProps> = ({ storeId }) => {
    const [storeData, setStoreData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                // Get store profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', storeId)
                    .single();

                // Get upcoming tournaments for this store
                const { data: upcomingTournaments } = await supabase
                    .from('tournaments')
                    .select('*')
                    .eq('store_id', storeId)
                    .gte('date', new Date().toISOString())
                    .order('date', { ascending: true })
                    .limit(3);

                // Get registered players count
                const { count: playersCount } = await supabase
                    .from('tournament_registrations')
                    .select('player_id', { count: 'exact', head: true })
                    .in('tournament_id', upcomingTournaments?.map(t => t.id) || []);

                // Get total tournaments hosted
                const { count: totalTournaments } = await supabase
                    .from('tournaments')
                    .select('*', { count: 'exact', head: true })
                    .eq('store_id', storeId);

                setStoreData({
                    profile,
                    upcomingTournaments: upcomingTournaments || [],
                    playersCount: playersCount || 0,
                    totalTournaments: totalTournaments || 0
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching store data:', error);
                setLoading(false);
            }
        };

        fetchStoreData();
    }, [storeId]);

    if (loading) {
        return (
            <div className="bg-slate-800/30 border-y border-slate-700/50 py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    const { profile, upcomingTournaments, playersCount, totalTournaments } = storeData || {};

    return (
        <div className="bg-gradient-to-r from-yellow-900/10 via-orange-900/10 to-yellow-900/10 border-y border-yellow-500/20 py-8 md:py-10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">

                    {/* Store Stats Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">🏪</span> Tu Tienda
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Torneos Realizados</span>
                                <span className="text-2xl font-black text-yellow-400 font-mono">{totalTournaments}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Jugadores Inscritos</span>
                                <span className="text-xl font-bold text-green-400">{playersCount}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-700">
                                <Link to="/tienda/perfil" className="text-sky-400 hover:text-sky-300 text-sm font-bold flex items-center gap-1">
                                    Ver Perfil de Tienda →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Tournaments Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📅</span> Tus Próximos Torneos
                        </h3>
                        {upcomingTournaments.length > 0 ? (
                            <div className="space-y-2">
                                {upcomingTournaments.slice(0, 2).map((tournament: any) => (
                                    <div key={tournament.id} className="text-sm">
                                        <p className="text-white font-bold line-clamp-1">{tournament.title}</p>
                                        <p className="text-slate-400 text-xs">
                                            {new Date(tournament.date).toLocaleDateString()} • {tournament.format}
                                        </p>
                                    </div>
                                ))}
                                <Link to="/tienda/torneos" className="text-sky-400 hover:text-sky-300 text-sm font-bold flex items-center gap-1 pt-2">
                                    Gestionar Torneos →
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-500 text-sm mb-3">No tienes torneos programados</p>
                                <Link to="/tienda/crear-torneo" className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded-lg transition-colors">
                                    Crear Torneo
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">⚡</span> Acciones Rápidas
                        </h3>
                        <div className="space-y-3">
                            <Link
                                to="/tienda/crear-torneo"
                                className="block w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold text-center rounded-lg transition-all transform hover:scale-105"
                            >
                                🏆 Crear Torneo
                            </Link>
                            <Link
                                to="/tienda/torneos"
                                className="block w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-center rounded-lg transition-colors"
                            >
                                📋 Gestionar Eventos
                            </Link>
                            <Link
                                to="/tienda/perfil"
                                className="block w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-center rounded-lg transition-colors"
                            >
                                ⚙️ Configuración
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreWidget;
