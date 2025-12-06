import React from 'react';
import { useParams, Link } from 'react-router-dom';
import type { TournamentResult, TournamentStanding } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';

// This would typically come from an API call, but we'll mock it here.
const mockAllTournaments: TournamentResult[] = [
    { id: 'tr1', name: 'Clasificatorio Nacional - Stgo', date: '2024-07-28', storeName: 'Magicsur', format: 'Standard', playerCount: 64 },
    { id: 'tr2', name: 'Store Championship Viña', date: '2024-07-27', storeName: 'Guildreams', format: 'Modern', playerCount: 32 },
];

// PWP points are now calculated based on the formula:
// Pts = ((Wins*3 + Draws*1) + ParticipationPts) * Multiplier
// tr1: 64 players -> 4 participation pts, Premier event -> x5 multiplier
// tr2: 32 players -> 3 participation pts, Store Championship -> x3 multiplier (assumed)
const mockStandingsData: { [key: string]: TournamentStanding[] } = {
    'tr1': [
        { rank: 1, playerName: 'MageSlayer92', matchRecord: '5-0-1', pwpEarned: 100 }, // ((5*3+1)+4)*5
        { rank: 2, playerName: 'ElfoNocturno', matchRecord: '5-1-0', pwpEarned: 95 },  // ((5*3+0)+4)*5
        { rank: 3, playerName: 'GoblinKing', matchRecord: '4-1-1', pwpEarned: 85 },  // ((4*3+1)+4)*5
        { rank: 4, playerName: 'AetherFlux', matchRecord: '4-2-0', pwpEarned: 80 },  // ((4*3+0)+4)*5
        { rank: 5, playerName: 'JaceMind', matchRecord: '4-2-0', pwpEarned: 80 },  // ((4*3+0)+4)*5
        { rank: 6, playerName: 'ShadowBlade', matchRecord: '4-2-0', pwpEarned: 80 },  // ((4*3+0)+4)*5
        { rank: 7, playerName: 'ArcaneWeaver', matchRecord: '3-2-1', pwpEarned: 70 },  // ((3*3+1)+4)*5
        { rank: 8, playerName: 'DragonHeart', matchRecord: '3-3-0', pwpEarned: 65 },  // ((3*3+0)+4)*5
        // ... more players
    ],
    'tr2': [
        { rank: 1, playerName: 'ProdigyMTG', matchRecord: '4-0-1', pwpEarned: 48 }, // ((4*3+1)+3)*3
        { rank: 2, playerName: 'Strategist', matchRecord: '4-1-0', pwpEarned: 45 }, // ((4*3+0)+3)*3
        { rank: 3, playerName: 'LaHechicera', matchRecord: '3-1-1', pwpEarned: 39 }, // ((3*3+1)+3)*3
        { rank: 4, playerName: 'ControlFreak', matchRecord: '3-2-0', pwpEarned: 36 }, // ((3*3+0)+3)*3
        // ... more players
    ],
};

const TournamentStandingsPage: React.FC = () => {
    const { tournamentId } = useParams<{ tournamentId: string }>();
    
    const tournamentInfo = mockAllTournaments.find(t => t.id === tournamentId);
    const standings = tournamentId ? mockStandingsData[tournamentId] : [];

    if (!tournamentInfo) {
        return (
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white">Torneo no encontrado</h1>
                <p className="text-slate-400 mt-4">El torneo que buscas no existe o ha sido eliminado.</p>
                <Link to="/torneos" className="mt-8 inline-block bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-700">
                    Volver al Repositorio
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                 <Link to="/torneos" className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Volver al Repositorio de Torneos
                </Link>
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">{tournamentInfo.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400">
                    <span>{tournamentInfo.date}</span>
                    <span className="hidden md:inline">|</span>
                    <span>Organizado por: <span className="font-semibold text-slate-300">{tournamentInfo.storeName}</span></span>
                    <span className="hidden md:inline">|</span>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-800 text-sky-200">{tournamentInfo.format}</span>
                     <span className="hidden md:inline">|</span>
                    <span>{tournamentInfo.playerCount} Jugadores</span>
                </div>
            </div>

            {/* Standings Table */}
            <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Puesto</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jugador</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Resultado (V-D-E)</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Puntos PWP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {standings?.map((player, index) => (
                            <tr key={player.playerName} className={`transition-colors duration-150 ${index < 8 ? 'bg-sky-900/20 hover:bg-sky-800/30' : 'hover:bg-slate-700/40'}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`text-lg font-bold w-8 text-center ${
                                        index === 0 ? 'text-yellow-400' :
                                        index === 1 ? 'text-gray-300' :
                                        index === 2 ? 'text-yellow-600' : 'text-slate-400'
                                    }`}>{player.rank}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{player.playerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-300 font-mono">{player.matchRecord}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-sky-400">
                                    <div className="flex items-center justify-end space-x-2">
                                        <span>{player.pwpEarned} pts</span>
                                        <TrophyIcon className="w-5 h-5 text-sky-500/70" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {(!standings || standings.length === 0) && (
                    <div className="text-center py-12 text-slate-400">
                        <p>No hay datos de standings disponibles para este torneo.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default TournamentStandingsPage;
