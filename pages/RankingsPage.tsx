
import React, { useMemo } from 'react';
import type { PlayerProfile } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';

interface RankingsPageProps {
    players: PlayerProfile[];
}

const RankingsPage: React.FC<RankingsPageProps> = ({ players }) => {

    const pwpRanking = useMemo(() => {
        return [...players]
            .sort((a, b) => b.pwp - a.pwp)
            .map((player, index) => ({ ...player, rank: index + 1 }));
    }, [players]);

    const winRateRanking = useMemo(() => {
        return [...players]
            .map(player => {
                const totalMatches = player.matchesWon + player.matchesLost + player.matchesDrew;
                const winRate = totalMatches > 0 ? (player.matchesWon / totalMatches) * 100 : 0;
                return { ...player, winRate };
            })
            .sort((a, b) => b.winRate - a.winRate)
            .map((player, index) => ({ ...player, rank: index + 1 }));
    }, [players]);


    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Clasificaciones Oficiales</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Explora los rankings de la temporada actual. El ciclo competitivo se reinicia cada 1 de Enero.
                </p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="relative w-full sm:w-auto">
                    <select className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full sm:w-72 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700 font-bold text-center">
                        <option value="2025">Temporada Actual (2025)</option>
                        <option value="2024">Temporada 2024</option>
                        <option value="2023">Temporada 2023</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* Ranking The Player */}
                <div className="space-y-4">
                    <div className="text-center md:text-left h-28 flex flex-col justify-center">
                        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Player Latam Series</h2>
                        <p className="text-md text-slate-400 mt-1">El ranking anual que premia tu participación y clasifica a los Top 32 para el Torneo Nacional.</p>
                    </div>
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-auto xl:h-20">
                        <div className="relative w-full sm:w-auto flex-grow">
                            <input
                                type="search"
                                placeholder="Buscar jugador..."
                                className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                            />
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <select className="bg-slate-900/80 text-white rounded-md py-2 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700">
                                <option value="Todas">Todas las Regiones</option>
                                <option value="Arica y Parinacota">Arica y Parinacota</option>
                                <option value="Tarapacá">Tarapacá</option>
                                <option value="Antofagasta">Antofagasta</option>
                                <option value="Atacama">Atacama</option>
                                <option value="Coquimbo">Coquimbo</option>
                                <option value="Valparaíso">Valparaíso</option>
                                <option value="Metropolitana">Metropolitana</option>
                                <option value="O'Higgins">O'Higgins</option>
                                <option value="Maule">Maule</option>
                                <option value="Ñuble">Ñuble</option>
                                <option value="Biobío">Biobío</option>
                                <option value="La Araucanía">La Araucanía</option>
                                <option value="Los Ríos">Los Ríos</option>
                                <option value="Los Lagos">Los Lagos</option>
                                <option value="Aysén">Aysén</option>
                                <option value="Magallanes">Magallanes</option>
                            </select>
                        </div>
                    </div>
                    {/* Ranking Table */}
                    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider sticky left-0 bg-slate-800 z-20 shadow-r">Puesto</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider sticky left-[4rem] bg-slate-800 z-20 shadow-r">Jugador</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Team</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Puntos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {pwpRanking.map((player, index) => (
                                    <tr key={`${player.id}-pwp`} className="hover:bg-slate-700/40 transition-colors duration-150 h-16 relative">
                                        <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-slate-800 z-10 border-r border-slate-700/50">
                                            <span className={`text-lg font-bold w-8 text-center block ${index === 0 ? 'text-yellow-400' :
                                                index === 1 ? 'text-gray-300' :
                                                    index === 2 ? 'text-yellow-600' : 'text-slate-400'
                                                }`}>{player.rank}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white sticky left-[4rem] bg-slate-800 z-10 border-r border-slate-700/50">
                                            {player.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-700 text-slate-300">
                                                {player.team || 'Sin Team'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-sky-400">
                                            <div className="flex items-center justify-end space-x-2">
                                                <span>{player.pwp} pts</span>
                                                <TrophyIcon className="w-5 h-5 text-sky-500" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PLS Winrate */}
                <div className="space-y-4">
                    <div className="text-center md:text-left h-28 flex flex-col justify-center">
                        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">PLS Winrate</h2>
                        <p className="text-md text-slate-400 mt-1">El ranking de temporada que premia la habilidad y clasifica al Top 16 para el Torneo de Planeswalkers.</p>
                    </div>
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-auto xl:h-20">
                        <div className="relative w-full sm:w-auto flex-grow">
                            <input
                                type="search"
                                placeholder="Buscar jugador..."
                                className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-violet-500 border border-slate-700"
                            />
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <select className="bg-slate-900/80 text-white rounded-md py-2 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 border border-slate-700">
                                <option value="Todas">Todas las Regiones</option>
                                <option value="Arica y Parinacota">Arica y Parinacota</option>
                                <option value="Tarapacá">Tarapacá</option>
                                <option value="Antofagasta">Antofagasta</option>
                                <option value="Atacama">Atacama</option>
                                <option value="Coquimbo">Coquimbo</option>
                                <option value="Valparaíso">Valparaíso</option>
                                <option value="Metropolitana">Metropolitana</option>
                                <option value="O'Higgins">O'Higgins</option>
                                <option value="Maule">Maule</option>
                                <option value="Ñuble">Ñuble</option>
                                <option value="Biobío">Biobío</option>
                                <option value="La Araucanía">La Araucanía</option>
                                <option value="Los Ríos">Los Ríos</option>
                                <option value="Los Lagos">Los Lagos</option>
                                <option value="Aysén">Aysén</option>
                                <option value="Magallanes">Magallanes</option>
                            </select>
                        </div>
                    </div>
                    {/* Ranking Table */}
                    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider sticky left-0 bg-slate-800 z-20 shadow-r">Puesto</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider sticky left-[4rem] bg-slate-800 z-20 shadow-r">Jugador</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Team</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {winRateRanking.map((player, index) => (
                                    <tr key={`${player.id}-wr`} className="hover:bg-slate-700/40 transition-colors duration-150 h-16 relative">
                                        <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-slate-800 z-10 border-r border-slate-700/50">
                                            <span className={`text-lg font-bold w-8 text-center block ${index === 0 ? 'text-yellow-400' :
                                                index === 1 ? 'text-gray-300' :
                                                    index === 2 ? 'text-yellow-600' : 'text-slate-400'
                                                }`}>{player.rank}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white sticky left-[4rem] bg-slate-800 z-10 border-r border-slate-700/50">
                                            {player.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-700 text-slate-300">
                                                {player.team || 'Sin Team'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-violet-400">
                                            <div className="flex items-center justify-end space-x-2">
                                                <span>{player.winRate?.toFixed(2)}%</span>
                                                <SparklesIcon className="w-5 h-5 text-violet-500" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RankingsPage;
