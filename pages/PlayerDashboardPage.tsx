import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { MarketplacePost } from '../types';
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
import AliasReminderBanner from '../components/AliasReminderBanner';

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number, rank?: string | number, color: 'sky' | 'purple' | 'emerald' | 'amber' | 'blue' }> = ({ icon, title, value, rank, color }) => {
    const colorMap = {
        sky: 'from-sky-500/20 to-sky-900/10 border-sky-500/30 text-sky-400',
        purple: 'from-purple-500/20 to-purple-900/10 border-purple-500/30 text-purple-400',
        emerald: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30 text-emerald-400',
        amber: 'from-amber-500/20 to-amber-900/10 border-amber-500/30 text-amber-400',
        blue: 'from-blue-500/20 to-blue-900/10 border-blue-500/30 text-blue-400'
    };

    const glowMap = {
        sky: 'text-glow-blue',
        purple: 'text-glow-purple',
        emerald: 'text-glow-blue', // fallback
        amber: 'text-glow-blue', // fallback
        blue: 'text-glow-blue'
    };

    return (
        <div className={`glass-premium glass-card-hover p-6 rounded-[2rem] border relative overflow-hidden group ${colorMap[color]}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 group-hover:opacity-15 transition-opacity blur-3xl ${colorMap[color]}`} />

            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80 group-hover:text-slate-400 transition-colors">{title}</p>
                    <p className={`text-4xl font-black text-white tracking-tighter ${glowMap[color]}`}>{value}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-6 duration-500 group-hover:border-white/10">
                    {icon}
                </div>
            </div>

            {rank !== undefined && rank !== 0 && rank !== '-' && (
                <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Rango Global</span>
                    <span className="text-xl font-black text-white px-3 py-1 bg-white/5 rounded-xl border border-white/10 italic tracking-tighter shadow-xl">
                        #{rank}
                    </span>
                </div>
            )}
        </div>
    );
};


const PlayerDashboardPage: React.FC<{ profile?: any, showAliasReminder?: boolean }> = ({ profile, showAliasReminder = false }) => {
    const [tournamentHistory, setTournamentHistory] = useState<any[]>([]);
    const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
    const [ranking, setRanking] = useState<{ pwpRank: number }>({ pwpRank: 0 });
    const [gameStats, setGameStats] = useState({ points: 0 });
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

            if (profile?.id) {
                console.log("Dashboard: Fetching registrations for user:", profile.id);
                const { data: userRegs, error: rError } = await supabase
                    .from('event_registrations')
                    .select(`
                        event_id,
                        scheduled_events!inner(*)
                    `)
                    .eq('player_id', profile.id)
                    .eq('status', 'confirmed');

                if (rError) console.error("Dashboard: Error fetching registrations:", rError);

                if (userRegs) {
                    console.log(`Dashboard: Found ${userRegs.length} total registrations`);
                    const upcoming = userRegs
                        .map((r: any) => r.scheduled_events)
                        .filter(e => e.game_type === currentGame) // Filter by current game
                        .filter(e => {
                            const parts = e.date.split('-');
                            const eventDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return eventDate >= today;
                        })
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    setRegisteredEvents(upcoming);
                }

                // 3. Fetch Ranking and Points for this specific game
                // We use the same RPC used in RankingsPage for consistency
                const { data: rankingData } = await supabase
                    .rpc('get_game_ranking', { p_game_type: currentGame });

                if (rankingData) {
                    const myStats = rankingData.find((r: any) => r.id === profile.id);
                    if (myStats) {
                        const myIndex = rankingData.findIndex((r: any) => r.id === profile.id);
                        setRanking({
                            pwpRank: myIndex + 1
                        });

                        setGameStats({
                            points: parseInt(myStats.pwp)
                        });
                    } else {
                        setRanking({ pwpRank: 0 });
                        setGameStats({ points: 0 });
                    }
                }

                // 4. Team Data
                if (profile.team_id) {
                    const { data: team } = await supabase
                        .from('teams')
                        .select('*')
                        .eq('id', profile.team_id)
                        .single();
                    setTeamData(team);
                }

                // 5. Check Gala Nomination
                const { data: awardData } = await supabase
                    .from('user_awards')
                    .select('id, award:award_id(name)')
                    .eq('user_id', profile.id);

                const nominated = awardData?.some(a => (a.award as any)?.name?.includes('Nominado Gala'));
                setIsNominated(!!nominated);

                // 6. Check Automatic Achievements
                const { data: grantedCount } = await supabase.rpc('check_and_grant_awards', { p_user_id: profile.id });
                if (grantedCount > 0) {
                    toast.success(`🎉 ¡Felicidades! Has desbloqueado ${grantedCount} nuevo(s) logro(s) por tu actividad.`, {
                        description: 'Revisa tu vitrina de trofeos para ver los detalles.',
                        duration: 6000,
                    });
                }
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

    return (
        <div className="space-y-12 animate-fade-in-up">
            {/* Alias Reminder for Players */}
            <AliasReminderBanner show={showAliasReminder} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-8 border-b border-slate-700/50">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase leading-[0.85]">
                            {greetingName}
                        </h1>
                        <div className="flex gap-2">
                            {profile?.is_pro && <ProBadge size="medium" />}
                            {(profile?.is_content_creator || profile?.role === 'content_creator') && <ContentCreatorBadge size="medium" />}
                            {isNominated && (
                                <div className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 animate-float shadow-[0_0_20px_rgba(245,158,11,0.15)] group cursor-help" title="Nominado a la Gala The Player 2025">
                                    <SparklesIcon className="w-4 h-4 text-amber-400 group-hover:scale-125 transition-transform" />
                                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Gala 25</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                        <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                            ID: {profile?.id?.substring(0, 8).toUpperCase()}
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                            REGION: {profile?.region || 'Sudamérica'}
                        </span>
                        <LevelBadge pwp={gameStats.points} size="sm" />
                    </div>

                    {(profile?.is_content_creator || profile?.role === 'content_creator') && (
                        <div className="pt-4">
                            <Link
                                to="/dashboard/creador"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl shadow-lg shadow-sky-900/20 transition-all hover:-translate-y-1 text-xs uppercase tracking-widest group"
                            >
                                <span className="group-hover:animate-pulse">🎬</span> Panel de Creador
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    {/* Team Preview Widget */}
                    <div className="glass-premium glass-card-hover p-5 rounded-3xl border border-white/5 flex items-center gap-4 min-w-[240px] shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent"></div>
                        <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner p-1">
                            {teamData?.logo_url ? (
                                <img src={teamData.logo_url} alt={teamData.name} className="w-full h-full object-contain rounded-xl" />
                            ) : (
                                <TrophyIcon className="w-7 h-7 text-sky-400" />
                            )}
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">TEAM</p>
                            <p className="text-white font-black text-lg leading-none tracking-tight">{teamData?.name || '-'}</p>
                            {teamData && (
                                <div className="mt-1.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Comunidad Activa</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PRO Upgrade Banner */}
            {!profile?.is_pro && (
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-slate-900 border border-purple-500/30 p-8 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                        Eleva tu Juego <ProBadge size="medium" />
                                    </h3>
                                    <p className="text-slate-400 font-medium mt-1 text-lg">
                                        Estadísticas exclusivas, perfil PRO y soporte prioritario.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowProModal(true)}
                                className="px-10 py-4 bg-white text-purple-950 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-900/20 uppercase tracking-widest text-sm"
                            >
                                Ver Planes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Level & XP Progression */}
            <section>
                <LevelProgressBar pwp={gameStats.points} />
            </section>

            {/* Event Reminders & Upcoming Events */}
            {registeredEvents.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                        📅 Mis Próximos Eventos
                    </h2>

                    {/* Dynamic Reminders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {registeredEvents.map(event => {
                            const parts = event.date.split('-');
                            const eventDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                            if (diffDays <= 1) {
                                return (
                                    <div key={`rem-${event.id}`} className={`p-6 rounded-2xl border-2 animate-pulse-slow ${diffDays === 0
                                        ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-900/20'
                                        : 'bg-orange-950/40 border-orange-500 shadow-lg shadow-orange-900/20'}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="text-4xl">
                                                {diffDays === 0 ? '🔥' : '⏰'}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">
                                                    {diffDays === 0 ? '¡HOY TIENES TORNEO!' : 'Recordatorio: Torneo Mañana'}
                                                </h3>
                                                <p className="text-slate-200 mt-1 font-medium">
                                                    {event.title} - {event.event_time || event.time} en {event.store_name}
                                                </p>
                                                <p className="text-sm text-slate-400 mt-3 flex items-center gap-2">
                                                    <span>🎒</span>
                                                    No olvides tus cartas, accesorios, playmat y protectores.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>

                    {/* All Registered Events List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-bold">
                        {registeredEvents.map(event => (
                            <Link
                                to="/eventos"
                                key={event.id}
                                className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl hover:border-sky-500 transition-all hover:bg-slate-800 group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-sky-400 text-xs uppercase tracking-widest">{event.format}</span>
                                    <span className="text-slate-500 text-xs">{event.date}</span>
                                </div>
                                <h4 className="text-white group-hover:text-sky-400 transition-colors">{event.title}</h4>
                                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                    <span className="flex items-center gap-1">📍 {event.store_name}</span>
                                    <span className="flex items-center gap-1">🕒 {event.event_time || event.time}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Metrics and Rest of the dashboard */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    icon={<TrophyIcon className="w-8 h-8" />}
                    title="Ranking PWP"
                    value={`#${ranking.pwpRank || '-'}`}
                    rank={ranking.pwpRank || '-'}
                    color="sky"
                />
                <StatCard
                    icon={<SparklesIcon className="w-8 h-8" />}
                    title="Player Points"
                    value={gameStats.points.toLocaleString()}
                    color="amber"
                />
                <StatCard
                    icon={<CheckCircleIcon className="w-8 h-8" />}
                    title="Torneos Jugados"
                    value={tournamentHistory.length}
                    color="emerald"
                />
                <StatCard
                    icon={<PencilIcon className="w-8 h-8" />}
                    title="Tasa de Victoria"
                    value="64%"
                    color="purple"
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
                <section className="lg:col-span-2 space-y-6">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Historial Reciente</h2>
                    <div className="glass-premium rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-slate-900/50">
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Torneo</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:table-cell">Pos</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-sky-500 uppercase tracking-widest">Puntos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-bold italic uppercase tracking-widest text-xs">Sincronizando datos...</td></tr>
                                ) : tournamentHistory.length > 0 ? (
                                    tournamentHistory.map(t => (
                                        <tr key={t.id} className="hover:bg-white/5 transition-colors cursor-default group">
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-black text-white group-hover:text-sky-400 transition-colors">{t.tournaments?.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{t.tournaments?.date} • {t.tournaments?.format}</p>
                                            </td>
                                            <td className="px-6 py-5 text-center hidden sm:table-cell">
                                                <span className="px-3 py-1 bg-slate-900/50 rounded-lg border border-white/5 text-xs font-black text-slate-400">#4</span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-lg font-black text-sky-400 tabular-nums">+{t.pwp_earned}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">Sin historial registrado para esta temporada.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* TEAM Section (1/3 width) */}
                <section className="space-y-6">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">TEAM</h2>
                    <div className="glass-premium p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        {teamData ? (
                            <div className="space-y-8 relative z-10 text-center">
                                <div className="relative inline-block">
                                    <div className="w-28 h-28 mx-auto bg-slate-900 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                        {teamData.logo_url ? <img src={teamData.logo_url} alt={teamData.name} className="w-full h-full object-contain p-2" /> :
                                            <TrophyIcon className="w-12 h-12 text-violet-400" />}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-violet-600 text-white p-2 rounded-xl shadow-lg border border-violet-400">
                                        <TrophyIcon className="w-4 h-4" />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter">{teamData.name}</h3>
                                    <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed italic">"{teamData.description || 'Nuestra comunidad de guerreros.'}"</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pb-4">
                                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 group-hover:text-violet-400 transition-colors">Rango</p>
                                        <p className="text-2xl font-black text-white">#1</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 group-hover:text-sky-400 transition-colors">Puntos</p>
                                        <p className="text-2xl font-black text-sky-400">1.2K</p>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-white/10 transition-all active:scale-95">
                                    Ver Perfil Completo
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8 py-4 relative z-10 text-center">
                                <div className="w-24 h-24 mx-auto bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/30 animate-pulse">
                                    <TrophyIcon className="w-10 h-10 text-sky-500" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">¿Sin Equipo?</h3>
                                    <p className="text-slate-400 text-sm px-6 font-medium">
                                        Funda tu propia comunidad o únete a una existente para dominar el ranking global.
                                    </p>
                                </div>
                                <div className="space-y-3 pt-4">
                                    <button
                                        onClick={() => setShowCreateTeam(true)}
                                        className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl shadow-xl shadow-sky-900/30 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest"
                                    >
                                        Fundar Equipo
                                    </button>
                                    <button className="w-full py-4 text-sky-400 hover:text-white font-black text-xs uppercase tracking-widest border border-sky-500/30 rounded-2xl transition-all">
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
