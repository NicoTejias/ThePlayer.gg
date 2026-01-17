import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { PlayerTournamentRecord, MarketplacePost } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import PlayerProModal from '../components/PlayerProModal';
import ProBadge from '../components/ProBadge';
import ContentCreatorBadge from '../components/ContentCreatorBadge';
import TrophyCase from '../components/TrophyCase';
import LevelBadge from '../components/LevelBadge';
import LevelProgressBar from '../components/LevelProgressBar';
import { toast } from 'sonner';
import { useGame } from '../context/GameContext';

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
    const [editingLeague, setEditingLeague] = useState<any>(null); // State for editing
    const [gameStats, setGameStats] = useState({ points: 0, wins: 0, losses: 0, draws: 0 });
    const [teamData, setTeamData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [showProModal, setShowProModal] = useState(false);
    const [isNominated, setIsNominated] = useState(false);

    const { currentGame } = useGame();

    useEffect(() => {
        if (profile?.id) {
            fetchPlayerData();
        }
    }, [profile?.id, currentGame]);

    const fetchPlayerData = async () => {
        setLoading(true);
        try {
            // 1. Fetch tournament history filtered by currentGame
            const { data: tournamentResults } = await supabase
                .from('tournament_results')
                .select(`
                    *,
                    tournaments!inner(
                        name,
                        date,
                        format,
                        game_type
                    )
                `)
                .eq('player_id', profile.id)
                .eq('tournaments.game_type', currentGame)
                .order('created_at', { ascending: false })
                .limit(10);

            setTournamentHistory(tournamentResults || []);

            // 2. Fetch Ranking and Points for this specific game
            // We use the same RPC used in RankingsPage for consistency
            const { data: rankingData } = await supabase
                .rpc('get_game_ranking', { p_game_type: currentGame });

            if (rankingData) {
                const myStats = rankingData.find((r: any) => r.id === profile.id);
                if (myStats) {
                    const myIndex = rankingData.findIndex((r: any) => r.id === profile.id);
                    setRanking({
                        pwpRank: myIndex + 1,
                        winRateRank: 0 // Could extract if needed
                    });

                    // Update stats for local display (calculated for this game)
                    setGameStats({
                        points: parseInt(myStats.pwp),
                        wins: parseInt(myStats.matches_won),
                        losses: parseInt(myStats.matches_lost),
                        draws: parseInt(myStats.matches_drew)
                    });
                } else {
                    setRanking({ pwpRank: 0, winRateRank: 0 });
                    setGameStats({ points: 0, wins: 0, losses: 0, draws: 0 });
                }
            }

            // 3. Team Data
            if (profile.team_id) {
                const { data: team } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('id', profile.team_id)
                    .single();
                setTeamData(team);
            }

            // 4. Check Gala Nomination
            const { data: awardData } = await supabase
                .from('user_awards')
                .select('id, award:award_id(name)')
                .eq('user_id', profile.id);

            const nominated = awardData?.some(a => (a.award as any)?.name?.includes('Nominado Gala'));
            setIsNominated(!!nominated);

            // 5. Check Automatic Achievements
            const { data: grantedCount } = await supabase.rpc('check_and_grant_awards', { p_user_id: profile.id });
            if (grantedCount > 0) {
                toast.success(`🎉 ¡Felicidades! Has desbloqueado ${grantedCount} nuevo(s) logro(s) por tu actividad.`, {
                    description: 'Revisa tu vitrina de trofeos para ver los detalles.',
                    duration: 6000,
                });
            }

        } catch (error) {
            console.error("Error fetching player data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;

        try {
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert({
                    name: newTeamName,
                    captain_id: profile.id
                })
                .select()
                .single();

            if (teamError) throw teamError;

            // Link player to the new team
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ team_id: team.id })
                .eq('id', profile.id);

            if (profileError) throw profileError;

            setTeamData(team);
            setShowCreateTeam(false);
            // Refresh to update profile in App.tsx might be needed, 
            // but for now we update local state
            window.location.reload(); // Quick way to refresh all data from Supabase
        } catch (err: any) {
            alert(err.message || "Error al crear equipo");
        }
    };

    const greetingName = profile?.first_name || profile?.username || 'Jugador';
    const totalMatches = gameStats.wins + gameStats.losses + gameStats.draws;
    const winRate = totalMatches > 0 ? ((gameStats.wins / totalMatches) * 100).toFixed(1) : '0.0';

    return (
        <div className="space-y-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Hola, {greetingName}</h1>
                        <LevelBadge pwp={gameStats.points} size="lg" />
                        {profile?.is_pro && <ProBadge size="medium" />}
                        {(profile?.is_content_creator || profile?.role === 'content_creator') && <ContentCreatorBadge size="medium" />}
                    </div>
                    <p className="text-lg text-slate-300 mt-2">
                        Bienvenido a tu panel de control Player Latam Series.
                    </p>

                    {(profile?.is_content_creator || profile?.role === 'content_creator') && (
                        <div className="mt-4">
                            <Link
                                to="/dashboard/creador"
                                className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-sky-900/40 transition-all hover:scale-105"
                            >
                                <span>🎬</span> Panel de Creador
                            </Link>
                        </div>
                    )}
                </div>

                {/* Team Status in Header */}
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/20">
                        {teamData?.logo_url ? <img src={teamData.logo_url} alt={teamData.name || 'Team Logo'} className="w-full h-full rounded-full" /> :
                            <TrophyIcon className="w-6 h-6 text-sky-400" />}
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">TEAM</p>
                        <p className="text-white font-bold">{teamData?.name || '-'}</p>
                    </div>
                </div>
            </div>

            {/* PRO Upgrade Banner */}
            {!profile?.is_pro && (
                <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 p-6 rounded-xl border-2 border-purple-500/50 shadow-2xl shadow-purple-900/50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-full">
                                <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    Mejora a <ProBadge size="small" />
                                </h3>
                                <p className="text-purple-200 text-sm mt-1">
                                    Desbloquea estadísticas avanzadas, perfil personalizado y beneficios exclusivos
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowProModal(true)}
                            className="px-6 py-3 bg-white text-purple-900 font-bold rounded-lg hover:bg-purple-50 transition-colors shadow-lg whitespace-nowrap"
                        >
                            Ver Planes
                        </button>
                    </div>
                </div>
            )}

            {/* Level & XP Progression */}
            <section>
                <LevelProgressBar pwp={gameStats.points} />
            </section>

            {/* Gala Nomination Card */}
            {isNominated && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-slate-900 border border-yellow-500/30 p-8 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -mr-32 -mt-32"></div>
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="w-24 h-24 bg-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-yellow-500/40 rotate-6 group-hover:rotate-12 transition-transform">
                            <span className="text-5xl">🎖️</span>
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">¡Felicitaciones, Nominado!</h3>
                            <p className="text-slate-300 text-lg">
                                Has sido seleccionado oficialmente para la <span className="text-yellow-500 font-bold">Gala de Premios 2026</span>.
                                Tu constancia y nivel te han llevado a la cima de la liga.
                            </p>
                        </div>
                        <button className="px-8 py-4 bg-yellow-500 text-slate-950 font-black rounded-xl hover:bg-yellow-400 transition-all shadow-lg active:scale-95">
                            VER MI INVITACIÓN
                        </button>
                    </div>
                </div>
            )}

            {/* Key Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                    icon={<TrophyIcon className="w-8 h-8" />}
                    title="Posición de Ranking"
                    value={`Rango #${ranking.pwpRank || '-'}`}
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

            {/* TROPHY CASE (Phase 3) */}
            {profile?.id && (
                <section>
                    <TrophyCase userId={profile.id} />
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tournament History (2/3 width) */}
                <section className="lg:col-span-2">
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Historial de Torneos</h2>
                    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Torneo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Resultado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Puntos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {loading ? (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Cargando historial...</td></tr>
                                ) : tournamentHistory.length > 0 ? (
                                    tournamentHistory.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-700/40">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-white">{t.tournaments?.name}</p>
                                                <p className="text-xs text-slate-400">{t.tournaments?.date}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                                                {t.wins}V - {t.losses}D - {t.draws}E
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-sky-400">+{t.pwp_earned}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Sin torneos registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Team Management (1/3 width) */}
                <section>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Comunidad</h2>
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl flex flex-col items-center text-center">
                        {teamData ? (
                            <div className="space-y-6 w-full">
                                <div className="w-24 h-24 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center border-2 border-sky-500/30">
                                    {teamData.logo_url ? <img src={teamData.logo_url} alt={teamData.name || 'Team Logo'} className="w-full h-full rounded-2xl" /> :
                                        <TrophyIcon className="w-10 h-10 text-sky-400" />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">{teamData.name}</h3>
                                    <p className="text-slate-400 text-sm mt-2">{teamData.description || 'Sin descripción del equipo.'}</p>
                                </div>
                                <div className="pt-6 border-t border-slate-700 grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Rango</p>
                                        <p className="text-white font-bold">#1</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Puntos</p>
                                        <p className="text-sky-400 font-bold">1,240</p>
                                    </div>
                                </div>
                                <button className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors mt-4">
                                    Ver Perfil de Equipo
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 py-4">
                                <div className="p-4 bg-sky-500/10 rounded-full inline-block">
                                    <TrophyIcon className="w-12 h-12 text-sky-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">¿No tienes equipo?</h3>
                                    <p className="text-slate-400 text-sm px-4 mt-2">
                                        Crea tu propia comunidad o únete a una existente para sumar puntos en conjunto.
                                    </p>
                                </div>
                                <div className="space-y-3 pt-4">
                                    <button
                                        onClick={() => setShowCreateTeam(true)}
                                        className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-lg shadow-lg shadow-sky-500/25 transition-all"
                                    >
                                        Fundar Equipo
                                    </button>
                                    <button className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-lg transition-all">
                                        Buscar Comunidad
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {showCreateTeam && (
                        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Fundar Comunidad</h2>
                                <p className="text-slate-400 mb-6 font-medium">Dale una identidad a tu equipo de batalla.</p>

                                <form onSubmit={handleCreateTeam} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nombre del Equipo</label>
                                        <input
                                            value={newTeamName}
                                            onChange={(e) => setNewTeamName(e.target.value)}
                                            placeholder="Nexo Gaming"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateTeam(false)}
                                            className="flex-1 py-3 border border-slate-700 text-slate-400 font-bold rounded-lg hover:bg-slate-700 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all"
                                        >
                                            Confirmar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* PRO Modal */}
            <PlayerProModal isOpen={showProModal} onClose={() => setShowProModal(false)} profile={profile} />
        </div>
    );
};

export default PlayerDashboardPage;
