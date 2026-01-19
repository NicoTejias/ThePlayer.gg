
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import TrophyIcon from '../components/icons/TrophyIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';

interface SeasonRecord {
    season_name: string;
    user: {
        id: string;
        username: string;
        first_name: string;
        last_name: string;
        region: string;
        avatar_url: string;
    };
    points_archived: number;
}

const HallOfFamePage: React.FC = () => {
    const [seasons, setSeasons] = useState<string[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<string>('');
    const [records, setRecords] = useState<SeasonRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSeasons();
    }, []);

    useEffect(() => {
        if (selectedSeason) {
            fetchRecords(selectedSeason);
        }
    }, [selectedSeason]);

    const fetchSeasons = async () => {
        try {
            const { data, error } = await supabase
                .from('season_history')
                .select('season_name')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const distinctSeasons = Array.from(new Set(data.map(d => d.season_name)));
            setSeasons(distinctSeasons);
            if (distinctSeasons.length > 0) {
                setSelectedSeason(distinctSeasons[0]);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Error fetching seasons:', err);
            setLoading(false);
        }
    };

    const fetchRecords = async (season: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('season_history')
                .select(`
                    points_archived,
                    season_name,
                    user:user_id (
                        id,
                        username,
                        first_name,
                        last_name,
                        region,
                        avatar_url
                    )
                `)
                .eq('season_name', season)
                .order('points_archived', { ascending: false })
                .limit(50);

            if (error) throw error;
            setRecords(data as any || []);
        } catch (err) {
            console.error('Error fetching records:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Legend Header */}
            <div className="text-center space-y-4 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-black uppercase tracking-widest border border-yellow-500/20 mb-4">
                    <span>👑</span> Salón de la Fama
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-tight pb-2">
                    Leyendas de <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 pr-2">The Player</span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl font-medium">
                    Honramos a los guerreros que alcanzaron la cima en temporadas pasadas. Los puntos se archivan, pero la gloria es eterna.
                </p>
            </div>

            {/* Season Selector */}
            {seasons.length > 0 ? (
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-wrap justify-center gap-4">
                        {seasons.map((season) => (
                            <button
                                key={season}
                                onClick={() => setSelectedSeason(season)}
                                className={`px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 border-2 ${selectedSeason === season
                                    ? 'bg-yellow-500 border-yellow-400 text-slate-950 shadow-lg shadow-yellow-500/20 scale-105'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                            >
                                {season}
                            </button>
                        ))}
                    </div>

                    {/* Records Table */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <TrophyIcon className="w-96 h-96 text-yellow-500" />
                        </div>

                        {loading ? (
                            <div className="p-20 text-center space-y-4">
                                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Convocando leyendas...</p>
                            </div>
                        ) : records.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900/80 border-b border-slate-800">
                                            <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Posición</th>
                                            <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Jugador</th>
                                            <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Región</th>
                                            <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Puntos Archivados</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {records.map((record, index) => {
                                            const rank = index + 1;
                                            const isTop3 = rank <= 3;
                                            const playerName = record.user?.first_name
                                                ? `${record.user.first_name} ${record.user.last_name || ''}`
                                                : record.user?.username || 'Desconocido';

                                            return (
                                                <tr key={record.user?.id || index} className="group hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${rank === 1 ? 'bg-yellow-500 text-slate-950 rotate-3' :
                                                            rank === 2 ? 'bg-slate-300 text-slate-900' :
                                                                rank === 3 ? 'bg-orange-600 text-white' :
                                                                    'bg-slate-800 text-slate-400'
                                                            }`}>
                                                            {rank}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex-shrink-0">
                                                                {record.user?.avatar_url ? (
                                                                    <img src={record.user.avatar_url} alt={playerName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">
                                                                        {playerName.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-black text-lg group-hover:text-yellow-400 transition-colors">
                                                                    {playerName}
                                                                </p>
                                                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                                                                    @{record.user?.username || 'user'}
                                                                </p>
                                                            </div>
                                                            {rank === 1 && <span className="text-2xl animate-bounce">🏆</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-slate-300 font-bold uppercase tracking-widest text-xs">
                                                        {record.user?.region || '-'}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className={`text-2xl font-black ${isTop3 ? 'text-yellow-400' : 'text-white'}`}>
                                                            {record.points_archived.toLocaleString()}
                                                        </span>
                                                        <span className="text-slate-500 text-[10px] ml-2 font-bold uppercase tracking-widest">Player Points</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-20 text-center">
                                <p className="text-slate-500">No hay registros para esta temporada.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-4xl mx-auto opacity-50 grayscale">
                            🏛️
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Historia en construcción</h2>
                        <p className="text-slate-400">
                            Todavía no hemos cerrado ninguna temporada. Los grandes nombres aparecerán aquí una vez concluya el primer ciclo de la PLS.
                        </p>
                    </div>
                </div>
            )}

            {/* Hall of Fame Call to Action */}
            <div className="max-w-5xl mx-auto bg-gradient-to-br from-yellow-500 to-orange-600 p-1 rounded-3xl">
                <div className="bg-slate-950 rounded-[22px] p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h3 className="text-3xl font-black text-white mb-2">ESCRIBE TU PROPIA HISTORIA</h3>
                        <p className="text-slate-400 font-medium max-w-lg">
                            Solo los mejores 50 jugadores de cada temporada son inmortalizados en este salón. ¿Crees que tienes lo necesario para entrar?
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = '#/ranking'}
                        className="px-10 py-5 bg-white text-slate-950 font-black rounded-2xl shadow-2xl hover:bg-yellow-400 transition-all transform hover:scale-110 active:scale-95 whitespace-nowrap"
                    >
                        IR AL RANKING ACTUAL
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HallOfFamePage;
