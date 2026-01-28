import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { Team, PlayerProfile } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';
import UsersIcon from '../components/icons/UserIcon';
import SparklesIcon from '../components/icons/SparklesIcon';

const TeamProfilePage: React.FC = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<PlayerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        fetchUser();
        if (teamId) {
            fetchTeamData();
        }
    }, [teamId]);

    const fetchTeamData = async () => {
        setLoading(true);
        try {
            // 1. Fetch team info
            const { data: teamData } = await supabase
                .from('teams')
                .select('*')
                .eq('id', teamId)
                .single();

            if (teamData) {
                // 2. Fetch members (profiles linked to this team)
                const { data: membersData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('team_id', teamId);

                setTeam({
                    id: teamData.id,
                    name: teamData.name,
                    logoUrl: teamData.logo_url,
                    description: teamData.description,
                    captainId: teamData.captain_id,
                    totalPoints: 0, // Will calculate below
                    memberCount: membersData?.length || 0
                });

                if (membersData) {
                    const mappedMembers = membersData.map(m => ({
                        id: m.id,
                        name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.username,
                        region: m.region,
                        points: m.pwp,
                        teamId: teamData.id,
                        isPublic: m.is_public
                    }));
                    setMembers(mappedMembers);

                    // Sum points
                    const totalPoints = mappedMembers.reduce((acc, m) => acc + m.points, 0);
                    setTeam(prev => prev ? { ...prev, totalPoints } : null);
                }
            }
        } catch (error) {
            console.error("Error fetching team:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        setIsJoining(true);
        try {
            // Check if player already has a team
            const { data: profile } = await supabase
                .from('profiles')
                .select('team_id')
                .eq('id', currentUser.id)
                .single();

            if (profile?.team_id) {
                alert("Ya perteneces a un equipo. Debes salir de tu equipo actual antes de unirte a uno nuevo.");
                return;
            }

            // Update profile with new team_id
            const { error } = await supabase
                .from('profiles')
                .update({ team_id: teamId })
                .eq('id', currentUser.id);

            if (error) throw error;

            alert(`¡Bienvenido a ${team?.name}!`);
            window.location.reload();
        } catch (err: any) {
            alert(err.message || "Error al unirse al equipo");
        } finally {
            setIsJoining(false);
        }
    };

    const isMember = currentUser && members.some(m => m.id === currentUser.id);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="text-center py-20">
                <h1 className="text-3xl font-bold text-white uppercase">Equipo no encontrado</h1>
                <button
                    onClick={() => navigate('/ranking')}
                    className="mt-6 px-6 py-2 bg-slate-700 text-white rounded-lg"
                >
                    Volver al Ranking
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Header Hero Section */}
            <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-slate-900 z-10"></div>
                {/* Background Pattern/Image */}
                <div className="absolute inset-0 bg-slate-800 opacity-50 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]"></div>

                <div className="absolute inset-0 z-20 flex flex-col md:flex-row items-center justify-between px-8 md:px-16 gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-900 rounded-2xl border-4 border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden">
                            {team.logoUrl ? (
                                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                            ) : (
                                <UsersIcon className="w-16 h-16 text-slate-700" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">{team.name}</h1>
                            <p className="text-slate-300 text-lg max-w-xl line-clamp-2 italic">
                                "{team.description || 'Esta comunidad aún no ha definido su lema de batalla.'}"
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                        <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-center px-8">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Player Points Totales</p>
                            <p className="text-3xl font-black text-sky-400 tabular-nums">{(team.totalPoints || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-center px-8">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Miembros</p>
                            <p className="text-3xl font-black text-white tabular-nums">{team.memberCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Roster Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <SparklesIcon className="w-8 h-8 text-sky-500" />
                            Roster Actual
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {members.map(member => (
                            <div key={member.id} className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 hover:border-sky-500/50 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-sky-500">
                                            <span className="text-sky-500 font-bold">{member.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">{member.name}</p>
                                            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{member.region || 'Desconocida'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sky-400 font-black text-xl">{member.points.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Points</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-end">
                                    <button className="text-xs text-sky-500 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        Ver Perfil
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <section className="bg-slate-800 p-8 rounded-3xl border border-slate-700 space-y-6">
                        <h3 className="text-xl font-bold text-white uppercase tracking-widest">Sobre el Equipo</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-slate-700">
                                <span className="text-slate-500 font-medium">Liderazgo</span>
                                <span className="text-white font-bold">Capitán</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-700">
                                <span className="text-slate-500 font-medium">Fundación</span>
                                <span className="text-white font-bold">Enero 2026</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-700">
                                <span className="text-slate-500 font-medium">Estilo</span>
                                <span className="text-white font-bold">Competitivo</span>
                            </div>
                        </div>

                        <button
                            onClick={handleJoinTeam}
                            disabled={isJoining || isMember}
                            className={`w-full py-4 font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest ${isMember
                                ? 'bg-slate-700 text-slate-500 cursor-default'
                                : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                                }`}
                        >
                            {isJoining ? 'Procesando...' : isMember ? 'Ya eres Miembro' : 'Unirse al Equipo'}
                        </button>
                    </section>

                    <section className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 text-center space-y-4">
                        <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto">
                            <TrophyIcon className="w-8 h-8 text-violet-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white uppercase">Siguiente Reto</h3>
                        <p className="text-slate-400 text-sm">Próximo torneo de comunidades: <br /><span className="text-white font-bold">Nacional de Equipos 2026</span></p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TeamProfilePage;
