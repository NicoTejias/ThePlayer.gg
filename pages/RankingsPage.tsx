import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { PlayerProfile, Team } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import UsersIcon from '../components/icons/UserIcon';
import { useGame } from '../context/GameContext';
import ProBadge from '../components/ProBadge';
import ContentCreatorBadge from '../components/ContentCreatorBadge';
import LevelBadge from '../components/LevelBadge';

interface RankingsPageProps {
    players: PlayerProfile[];
    teams: Team[];
}

const RankingsPage: React.FC<RankingsPageProps> = ({ players, teams }) => {
    const { currentGame } = useGame();
    const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');

    const getPointsLabel = () => {
        switch (currentGame) {
            case 'mtg': return 'Pts';
            case 'pokemon': return 'CP';
            default: return 'Pts';
        }
    };

    const getRankingTitle = () => {
        switch (currentGame) {
            case 'mtg': return 'Player Latam Series';
            default: return `Ranking ${currentGame === 'pokemon' ? 'Pokémon' : 'General'}`;
        }
    };


    const pwpRanking = useMemo(() => {
        // La data ya viene filtrada y ordenada desde App.tsx (Single Source of Truth)
        // Solo agregamos la lógica de anonimato visual
        return [...players]
            // Aseguramos orden por si acaso
            .sort((a, b) => b.pwp - a.pwp)
            .map((player, index) => {
                const hashCode = player.id.split('').reduce((acc, char) => {
                    return char.charCodeAt(0) + ((acc << 5) - acc);
                }, 0);
                const anonymousNumber = Math.abs(hashCode % 9000) + 1000;

                return {
                    ...player,
                    rank: index + 1,
                    // name: player.isPublic ? player.name : `Jugador #${anonymousNumber}`
                    name: player.name // Always show name as per user request
                };
            });
    }, [players]);

    const winRateRanking = useMemo(() => {
        return [...players]
            .map(player => {
                const totalMatches = player.matchesWon + player.matchesLost + player.matchesDrew;
                const winRate = totalMatches > 0 ? (player.matchesWon / totalMatches) * 100 : 0;
                return { ...player, winRate, totalMatches };
            })
            // FILTRO: Solo jugadores con al menos 15 partidas (aproximadamente 5 torneos)
            .filter(player => player.totalMatches >= 15)
            .sort((a, b) => b.winRate - a.winRate)
            .map((player, index) => {
                const hashCode = player.id.split('').reduce((acc, char) => {
                    return char.charCodeAt(0) + ((acc << 5) - acc);
                }, 0);
                const anonymousNumber = Math.abs(hashCode % 9000) + 1000;

                return {
                    ...player,
                    rank: index + 1,
                    // name: player.isPublic ? player.name : `Jugador #${anonymousNumber}`
                    name: player.name
                };
            });
    }, [players]);

    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Clasificaciones Oficiales</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Explora los rankings de la temporada actual. Al finalizar el ciclo, se conserva el <span className="text-sky-400 font-bold text-xl">50%</span> de los **Player Points** para la siguiente temporada.
                </p>

                {/* SALON DE LA FAMA LINK */}
                <div className="mt-6">
                    <Link
                        to="/hall-of-fame"
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-yellow-500/10 text-yellow-500 text-sm font-black uppercase tracking-widest border border-yellow-500/20 hover:bg-yellow-500 hover:text-slate-950 transition-all transform hover:scale-105"
                    >
                        <span>👑</span> Ver Salón de la Fama
                    </Link>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex flex-col items-center space-y-6">
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 w-full max-w-md">
                    <button
                        onClick={() => setActiveTab('individual')}
                        className={`flex-1 py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'individual' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                        🏆 Individual
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`flex-1 py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'team' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                        ⚔️ Comunidades
                    </button>
                </div>

                <div className="relative w-full sm:w-auto">
                    <select
                        title="Seleccionar temporada"
                        aria-label="Seleccionar temporada"
                        className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full sm:w-72 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700 font-bold text-center"
                    >
                        <option value="2026">Temporada Actual (2026)</option>
                        <option value="2025">Temporada 2025</option>
                        <option value="2024">Temporada 2024</option>
                    </select>
                </div>
            </div>

            {activeTab === 'individual' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    {/* Ranking Pts */}
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="text-center md:text-left h-28 flex flex-col justify-center">
                            <h2 className="text-3xl font-bold text-white uppercase tracking-wider">{getRankingTitle()}</h2>
                            <p className="text-md text-slate-400 mt-1">Suma de {getPointsLabel()} obtenidos en torneos oficiales.</p>
                        </div>
                        {/* Tab Content here (Individual Table) */}
                        <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Puesto</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jugador</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Team</th>
                                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Pts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {pwpRanking.map((player, index) => (
                                        <tr
                                            key={player.id}
                                            className={`transition-colors ${player.is_pro
                                                ? 'bg-gradient-to-r from-purple-900/20 to-transparent border-l-4 border-purple-500 hover:from-purple-900/30'
                                                : 'hover:bg-slate-700/40'
                                                }`}
                                        >
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold text-slate-400">{index + 1}</td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium text-sm sm:text-base">{player.name}</span>
                                                    <LevelBadge pwp={player.pwp} size="sm" />
                                                    {player.is_pro && <ProBadge size="small" />}
                                                    {player.is_content_creator && <ContentCreatorBadge size="small" />}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                {player.teamId ? (
                                                    <Link to={`/equipo/${player.teamId}`} className="px-2 inline-flex text-xs font-semibold rounded-full bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors">
                                                        {player.teamData?.name || player.team}
                                                    </Link>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-slate-700 text-slate-300">
                                                        {player.team || '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sky-400 font-bold">{player.pwp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Ranking Winrate */}
                    <div className="space-y-4 animate-fade-in-up animate-delay-100">
                        <div className="text-center md:text-left h-28 flex flex-col justify-center">
                            <h2 className="text-3xl font-bold text-white uppercase tracking-wider">PLS Winrate</h2>
                            <p className="text-md text-slate-400 mt-1">Premia la efectividad en el campo de batalla.</p>
                        </div>
                        <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Puesto</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jugador</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Team</th>
                                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">WR</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {winRateRanking.map((player, index) => (
                                        <tr
                                            key={`${player.id}-wr`}
                                            className={`transition-colors ${player.is_pro
                                                ? 'bg-gradient-to-r from-purple-900/20 to-transparent border-l-4 border-purple-500 hover:from-purple-900/30'
                                                : 'hover:bg-slate-700/40'
                                                }`}
                                        >
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold text-slate-400">{index + 1}</td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium text-sm sm:text-base">{player.name}</span>
                                                    <LevelBadge pwp={player.pwp} size="sm" />
                                                    {player.is_pro && <ProBadge size="small" />}
                                                    {player.is_content_creator && <ContentCreatorBadge size="small" />}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                {player.teamId ? (
                                                    <Link to={`/equipo/${player.teamId}`} className="px-2 inline-flex text-xs font-semibold rounded-full bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors">
                                                        {player.teamData?.name || player.team}
                                                    </Link>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-slate-700 text-slate-300">
                                                        {player.team || '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-violet-400 font-bold">{player.winRate?.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
                    <div className="text-center h-28 flex flex-col justify-center">
                        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Copa de Comunidades</h2>
                        <p className="text-md text-slate-400 mt-1">El ranking agregado de equipos. ¡Suma puntos con tus compañeros!</p>
                    </div>

                    <div className="overflow-x-auto bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="px-3 sm:px-8 py-3 sm:py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Pos</th>
                                    <th className="px-3 sm:px-8 py-3 sm:py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Comunidad</th>
                                    <th className="px-3 sm:px-8 py-3 sm:py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-widest">Miembros</th>
                                    <th className="px-3 sm:px-8 py-3 sm:py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-widest">Puntos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {teams.map((team, index) => (
                                    <tr key={team.id} className="hover:bg-slate-700/40 transition-all duration-200 group h-20">
                                        <td className="px-3 sm:px-8 py-4 whitespace-nowrap">
                                            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-black text-sm sm:text-lg ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                index === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                                                    index === 2 ? 'bg-orange-900/40 text-orange-400 border border-orange-800/30' :
                                                        'bg-slate-900/50 text-slate-500 border border-slate-700'
                                                }`}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-8 py-4 whitespace-nowrap">
                                            <Link to={`/equipo/${team.id}`} className="flex items-center gap-2 sm:gap-4 group/item">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 group-hover/item:border-violet-500/50 transition-colors">
                                                    {team.logoUrl ? (
                                                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain rounded-lg" />
                                                    ) : (
                                                        <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-hover/item:text-violet-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-sm sm:text-xl font-bold text-white group-hover/item:text-violet-400 transition-colors">{team.name}</span>
                                                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 max-w-[100px] sm:max-w-xs truncate">{team.description || 'Sin descripción'}</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-3 sm:px-8 py-4 whitespace-nowrap text-center">
                                            <span className="px-2 sm:px-3 py-1 bg-slate-900/80 rounded-full text-slate-300 font-mono text-xs sm:text-sm border border-slate-700">
                                                {team.memberCount} M
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-8 py-4 whitespace-nowrap text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg sm:text-2xl font-black text-violet-400 tabular-nums tracking-tighter">
                                                    {team.totalPwp?.toLocaleString()}
                                                </span>
                                                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pts</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {teams.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-12 text-center text-slate-500">
                                            No hay comunidades oficiales registradas todavía.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RankingsPage;
