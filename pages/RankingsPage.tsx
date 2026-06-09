import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { PlayerProfile, Team, TournamentResult } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import UsersIcon from '../components/icons/UserIcon';
import { useGame } from '../context/GameContext';
import ProBadge from '../components/ProBadge';
import ContentCreatorBadge from '../components/ContentCreatorBadge';
import LevelBadge from '../components/LevelBadge';
import TierBadge from '../components/TierBadge';
import SEO from '../components/SEO';
import { supabase } from '../supabaseClient';

interface RankingsPageProps {
    players: PlayerProfile[];
    teams: Team[];
    tournaments: TournamentResult[];
}

const RankingsPage: React.FC<RankingsPageProps> = ({ players, teams, tournaments }) => {
    const { currentGame } = useGame();
    const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedFormat, setSelectedFormat] = useState('');
    const [selectedStore, setSelectedStore] = useState('');

    // Filtered ranking state (used when format or store filter is active)
    const [filteredPlayers, setFilteredPlayers] = useState<PlayerProfile[] | null>(null);
    const [isLoadingFiltered, setIsLoadingFiltered] = useState(false);

    const ITEMS_PER_PAGE = 50;
    const [currentPage, setCurrentPage] = useState(1);

    // Derive available filter options from tournament data
    // Raw DB rows use snake_case; mapped rows use camelCase — handle both
    const filterOptions = useMemo(() => {
        const formats = Array.from(new Set(
            tournaments.map(t => t.format).filter(Boolean)
        )).sort() as string[];
        const stores = Array.from(new Set(
            tournaments.map(t => (t as any).store_name || t.storeName).filter(Boolean)
        )).sort() as string[];
        return { formats, stores };
    }, [tournaments]);

    const regions = useMemo(() => {
        const uniqueRegions = new Set<string>();
        players.forEach(p => { if (p.region) uniqueRegions.add(p.region); });
        return Array.from(uniqueRegions).sort();
    }, [players]);

    // Fetch filtered ranking when format or store changes
    useEffect(() => {
        if (!selectedFormat && !selectedStore) {
            setFilteredPlayers(null);
            return;
        }
        let cancelled = false;
        const fetch = async () => {
            setIsLoadingFiltered(true);
            try {
                const { data, error } = await supabase.rpc('get_game_ranking_filtered', {
                    p_game_type: currentGame,
                    p_format: selectedFormat || null,
                    p_store_name: selectedStore || null,
                });
                if (cancelled) return;
                if (error) throw error;
                if (data) {
                    setFilteredPlayers(data.map((p: any) => ({
                        ...p,
                        name: p.username || (p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : 'Jugador Sin Nombre'),
                        points: p.pwp,
                        tournaments_played: Number(p.tournaments_played),
                    })));
                }
            } catch (e) {
                console.error('Error al cargar ranking filtrado:', e);
                setFilteredPlayers(null);
            } finally {
                if (!cancelled) setIsLoadingFiltered(false);
            }
        };
        fetch();
        return () => { cancelled = true; };
    }, [selectedFormat, selectedStore, currentGame]);

    // Reset page when any filter changes
    useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedRegion, selectedFormat, selectedStore]);

    const activePlayers = filteredPlayers ?? players;

    const getPointsLabel = () => {
        switch (currentGame) {
            case 'mtg': return 'Pts';
            case 'pokemon': return 'CP';
            default: return 'Pts';
        }
    };

    const getRankingTitle = () => {
        const parts: string[] = [];
        if (selectedFormat) parts.push(selectedFormat);
        if (selectedStore) parts.push(selectedStore);
        if (parts.length) return `Ranking · ${parts.join(' · ')}`;
        switch (currentGame) {
            case 'mtg': return 'Player Latam Series';
            default: return `Ranking ${currentGame === 'pokemon' ? 'Pokémon' : 'General'}`;
        }
    };

    const getPlayerBadges = (player: any, index: number) => {
        const badges = [];
        if (index < 3) badges.push({ icon: '🔥', label: 'On Fire', color: 'text-orange-400' });
        if (player.points > 5000) badges.push({ icon: '🎖️', label: 'Veterano', color: 'text-slate-400' });
        if (index < 20 && player.win_rate && Number(player.win_rate) > 65) badges.push({ icon: '⭐', label: 'Rising Star', color: 'text-amber-400' });
        return badges;
    };

    const fullRanking = useMemo(() => {
        return [...activePlayers].sort((a, b) => (b.points || 0) - (a.points || 0));
    }, [activePlayers]);

    const filteredRanking = useMemo(() => {
        return fullRanking
            .map((player, index) => ({ ...player, globalRank: index + 1 }))
            .filter(player => {
                const nameMatch = (player.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                const usernameMatch = (player.username || '').toLowerCase().includes(searchQuery.toLowerCase());
                const matchesSearch = nameMatch || usernameMatch;
                const matchesRegion = !selectedRegion || player.region === selectedRegion;
                return matchesSearch && matchesRegion;
            });
    }, [fullRanking, searchQuery, selectedRegion]);

    const displayedPlayers = useMemo(() => {
        return filteredRanking.slice(0, currentPage * ITEMS_PER_PAGE);
    }, [filteredRanking, currentPage]);

    const processedTeams = useMemo(() => {
        const stats: Record<string, { totalPoints: number, memberCount: number }> = {};
        players.forEach(p => {
            const tId = p.teamId || p.team_id;
            if (tId) {
                if (!stats[tId]) stats[tId] = { totalPoints: 0, memberCount: 0 };
                stats[tId].totalPoints += p.points || 0;
                stats[tId].memberCount += 1;
            }
        });
        return teams.map(t => ({
            ...t,
            totalPoints: stats[t.id]?.totalPoints || 0,
            memberCount: stats[t.id]?.memberCount || 0
        })).sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    }, [players, teams]);

    const hasActiveFilters = !!(selectedFormat || selectedStore || selectedRegion || searchQuery);

    const clearFilters = () => {
        setSelectedFormat('');
        setSelectedStore('');
        setSelectedRegion('');
        setSearchQuery('');
    };

    return (
        <div className="space-y-12 pb-20">
            <SEO
                title={getRankingTitle()}
                description={`Ranking oficial de ${currentGame} en Chile. Revisa los mejores jugadores de la temporada, sus puntos y estadísticas.`}
            />
            <div className="text-center space-y-4 pt-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-black uppercase tracking-[0.2em] animate-fade-in">
                    <SparklesIcon className="w-3 h-3" />
                    Resultados Oficiales de Temporada
                </div>
                <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-2xl">
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 inline-block pr-6 pb-2">The Ranking</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                    Al finalizar el ciclo, se conserva el <span className="text-sky-400 font-bold underline decoration-sky-500/30 underline-offset-4">50%</span> de los Player Points para la siguiente temporada.
                </p>

                <div className="pt-4">
                    <Link
                        to="/hall-of-fame"
                        className="group inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-slate-900 border border-yellow-500/20 text-yellow-500 text-sm font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-slate-950 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-yellow-500/20"
                    >
                        <span className="text-lg group-hover:rotate-12 transition-transform">👑</span>
                        Ver Salón de la Fama
                    </Link>
                </div>
            </div>

            {/* Nav & Filters Hub */}
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col gap-4 glass-premium p-4 rounded-[2rem] border border-white/5">
                    {/* Top row: tab switcher + search */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 w-full lg:w-auto">
                            <button
                                onClick={() => setActiveTab('individual')}
                                className={`flex-1 lg:flex-none py-3 px-8 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'individual' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <span className="text-base">👤</span> Individual
                            </button>
                            <button
                                onClick={() => setActiveTab('team')}
                                className={`flex-1 lg:flex-none py-3 px-8 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'team' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <span className="text-base">⚔️</span> Comunidades
                            </button>
                        </div>

                        {activeTab === 'individual' && (
                            <div className="relative flex-grow max-w-md w-full">
                                <input
                                    type="text"
                                    placeholder="Buscar por jugador o @nick..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-14 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-bold text-sm"
                                />
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-slate-900/50 text-slate-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filter row: format, store, region */}
                    {activeTab === 'individual' && (
                        <div className="flex flex-wrap gap-3 items-center">
                            <select
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                                title="Filtrar por formato"
                                className="bg-slate-950/50 border border-white/5 rounded-xl py-3 px-4 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 min-w-[160px]"
                            >
                                <option value="">Todos los formatos</option>
                                {filterOptions.formats.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>

                            <select
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                                title="Filtrar por tienda"
                                className="bg-slate-950/50 border border-white/5 rounded-xl py-3 px-4 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 min-w-[160px]"
                            >
                                <option value="">Todas las tiendas</option>
                                {filterOptions.stores.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                title="Filtrar por región"
                                className="bg-slate-950/50 border border-white/5 rounded-xl py-3 px-4 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 min-w-[160px]"
                            >
                                <option value="">Todas las regiones</option>
                                {regions.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest border border-white/5 transition-all"
                                >
                                    Limpiar filtros ✕
                                </button>
                            )}

                            {(selectedFormat || selectedStore) && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-black uppercase tracking-wider">
                                    {isLoadingFiltered ? (
                                        <span className="animate-pulse">Calculando ranking...</span>
                                    ) : (
                                        <span>Ranking filtrado activo</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Table Content */}
                {activeTab === 'individual' ? (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex flex-col md:flex-row items-center justify-between px-6">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                                {getRankingTitle()}
                            </h2>
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-[0.2em] pt-2 md:pt-0">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Mostrando {displayedPlayers.length} de {filteredRanking.length} jugadores
                            </div>
                        </div>

                        <div className="glass-premium rounded-[2.5rem] border border-white/5 shadow-2xll overflow-hidden overflow-x-auto">
                            {isLoadingFiltered ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="flex flex-col items-center gap-4 text-slate-500">
                                        <div className="w-8 h-8 border-2 border-sky-500/50 border-t-sky-500 rounded-full animate-spin" />
                                        <span className="text-xs font-black uppercase tracking-widest">Calculando ranking...</span>
                                    </div>
                                </div>
                            ) : (
                                <table className="min-w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-950/40 border-b border-white/5 text-xs sm:text-xs">
                                            <th className="px-6 py-6 text-left font-black text-slate-500 uppercase tracking-[0.2em] w-24 text-center">Rango</th>
                                            <th className="px-6 py-6 text-left font-black text-slate-500 uppercase tracking-[0.2em]">Jugador</th>
                                            <th className="hidden lg:table-cell px-6 py-6 text-left font-black text-slate-500 uppercase tracking-[0.2em]">Territorio</th>
                                            <th className="hidden md:table-cell px-6 py-6 text-left font-black text-slate-500 uppercase tracking-[0.2em]">Escuadrón</th>
                                            <th className="hidden sm:table-cell px-6 py-6 text-center font-black text-slate-500 uppercase tracking-[0.2em] w-28">Win %</th>
                                            <th className="px-6 py-6 text-right font-black text-sky-400 uppercase tracking-[0.2em] w-32">{getPointsLabel()}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {displayedPlayers.map((player) => {
                                            const index = player.globalRank - 1;
                                            const isTop3 = index < 3;
                                            return (
                                                <tr
                                                    key={player.id}
                                                    className={`group transition-all duration-300 hover:bg-white/[0.02] ${player.is_pro ? 'bg-sky-500/[0.02]' : ''}`}
                                                >
                                                    <td className="px-6 py-6">
                                                        <div className="flex justify-center">
                                                            <span className={`text-2xl font-black italic tabular-nums leading-none ${index === 0 ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)] scale-125' :
                                                                index === 1 ? 'text-slate-300 drop-shadow-[0_0_12px_rgba(203,213,225,0.4)] scale-110' :
                                                                    index === 2 ? 'text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]' :
                                                                        'text-slate-700'
                                                                }`}>
                                                                {player.globalRank}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative group/avatar">
                                                                <div className={`w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden transition-transform group-hover/avatar:scale-110 ${player.is_pro ? 'bg-gradient-to-br from-sky-500 to-indigo-600' : 'bg-slate-900'}`}>
                                                                    <span className="text-white font-black text-lg">{(player.name || '?')[0]}</span>
                                                                </div>
                                                                {player.is_pro && (
                                                                    <div className="absolute -top-2 -right-2 p-1 bg-sky-500 rounded-full border-2 border-slate-950 shadow-lg" title="Pro Member">
                                                                        <SparklesIcon className="w-3 h-3 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-white font-bold text-base truncate group-hover:text-sky-400 transition-colors">
                                                                        {player.name}
                                                                    </span>
                                                                    <div className="flex gap-1">
                                                                        {getPlayerBadges(player, index).map((b, i) => (
                                                                            <span key={i} title={b.label} className={`text-xs cursor-help ${b.color} animate-pulse`}>{b.icon}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <TierBadge points={player.points} size="sm" />
                                                                    {player.is_content_creator && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-black uppercase tracking-widest border border-pink-500/20">CREATOR</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="hidden lg:table-cell px-6 py-6">
                                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{player.region || '-'}</span>
                                                    </td>
                                                    <td className="hidden md:table-cell px-6 py-6 font-mono text-xs">
                                                        {player.teamId || player.team_id ? (
                                                            <Link to={`/equipo/${player.teamId || player.team_id}`} className="inline-flex px-3 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/5 hover:border-violet-500/50 hover:text-violet-400 transition-all font-black uppercase tracking-tighter">
                                                                {player.teamData?.name || player.team || '-'}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-slate-700 font-bold">-</span>
                                                        )}
                                                    </td>
                                                    <td className="hidden sm:table-cell px-6 py-6 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className={`text-sm font-black font-mono ${Number(player.win_rate || 0) >= 60 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                                {player.win_rate ? `${player.win_rate}%` : '-'}
                                                            </span>
                                                            <span className="text-xs text-slate-700 font-black uppercase tracking-widest">{player.tournaments_played || 0} Tours</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-2xl font-black italic tracking-tighter leading-none tabular-nums ${isTop3 ? 'text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]' : 'text-white'}`}>
                                                                {(player.points || 0).toLocaleString()}
                                                            </span>
                                                            <span className="text-xs text-slate-600 font-black uppercase tracking-widest mt-1">{getPointsLabel()}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {displayedPlayers.length === 0 && !isLoadingFiltered && (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 text-slate-600">
                                                        <TrophyIcon className="w-12 h-12 opacity-20" />
                                                        <p className="text-sm font-black uppercase tracking-widest">Sin resultados para estos filtros</p>
                                                        {hasActiveFilters && (
                                                            <button onClick={clearFilters} className="text-sky-400 hover:text-sky-300 text-xs font-bold underline">
                                                                Limpiar filtros
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {!isLoadingFiltered && displayedPlayers.length < filteredRanking.length && (
                                <div className="p-8 border-t border-white/5 flex justify-center">
                                    <button
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-white/10 transition-all active:scale-95 shadow-xl"
                                    >
                                        Cargar más jugadores
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex flex-col md:flex-row items-center justify-between px-6">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Copa de Comunidades</h2>
                            <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] pt-2 md:pt-0">Puntaje agregado por equipo</p>
                        </div>

                        <div className="glass-premium rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden overflow-x-auto">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-950/40 border-b border-white/5 text-xs sm:text-xs">
                                        <th className="px-6 py-6 text-left font-black text-slate-500 uppercase tracking-[0.2em] w-24 text-center">Pos</th>
                                        <th className="px-6 py-6 text-left font-black text-slate-500 uppercase tracking-[0.2em]">Comunidad</th>
                                        <th className="px-6 py-6 text-center font-black text-slate-500 uppercase tracking-[0.2em]">Poderío (M)</th>
                                        <th className="px-6 py-6 text-right font-black text-violet-400 uppercase tracking-[0.2em] w-40 flex-shrink-0">T. Points</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {processedTeams.map((team, index) => (
                                        <tr key={team.id} className="group hover:bg-white/[0.02] transition-colors h-24">
                                            <td className="px-6 py-6 text-center">
                                                <span className={`text-2xl font-black italic tabular-nums leading-none ${index === 0 ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]' :
                                                    index === 1 ? 'text-slate-300' :
                                                        index === 2 ? 'text-orange-500' :
                                                            'text-slate-700'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <Link to={`/equipo/${team.id}`} className="flex items-center gap-4 group/item">
                                                    <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 group-hover/item:border-violet-500/50 transition-all p-1">
                                                        {team.logoUrl ? (
                                                            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain rounded-xl" />
                                                        ) : (
                                                            <UsersIcon className="w-6 h-6 text-slate-700 group-hover/item:text-violet-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-xl font-black text-white group-hover/item:text-violet-400 transition-colors block leading-none">
                                                            {team.name}
                                                        </span>
                                                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mt-1.5 truncate max-w-[200px]">
                                                            {team.description || 'Comunidad establecida'}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 font-mono text-xs">
                                                    <UsersIcon className="w-3 h-3" />
                                                    {team.memberCount} Activos
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-2xl font-black italic tracking-tighter text-violet-400 drop-shadow-[0_0_12px_rgba(167,139,250,0.5)] leading-none tabular-nums">
                                                        {(team.totalPoints || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-slate-600 font-black uppercase tracking-widest mt-1">Sumatoria Pts</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {processedTeams.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-600">
                                                    <UsersIcon className="w-12 h-12 opacity-20" />
                                                    <p className="text-sm font-black uppercase tracking-widest">Aún no hay comunidades en pie de guerra</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RankingsPage;
