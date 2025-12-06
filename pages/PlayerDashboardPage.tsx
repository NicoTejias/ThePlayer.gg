import React from 'react';
import type { PlayerTournamentRecord, MarketplacePost } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';

const mockTournamentHistory: PlayerTournamentRecord[] = [
    { id: 'pt1', tournamentName: 'FNM Modern Julio', date: '2024-07-26', format: 'Modern', result: '3-1-0', pointsEarned: 45 },
    { id: 'pt2', tournamentName: 'Clasificatorio RCQ', date: '2024-07-20', format: 'Pioneer', result: '4-2-0', pointsEarned: 120 },
    { id: 'pt3', tournamentName: 'Draft de Outlaws', date: '2024-07-12', format: 'Draft', result: '2-1-0', pointsEarned: 30 },
    { id: 'pt4', tournamentName: 'Semanal Legacy', date: '2024-07-05', format: 'Legacy', result: '1-2-0', pointsEarned: 15 },
];

const mockPlayerMarketplacePosts: MarketplacePost[] = [
    { id: 'mp1', title: 'Vendo Force of Will [2XM]', type: 'Venta', seller: 'MageSlayer92', price: 45000, region: 'Metropolitana', imageUrl: ''},
    { id: 'mp2', title: 'Busco 4x Ragavan', type: 'Compra', seller: 'MageSlayer92', price: 35000, region: 'Metropolitana', imageUrl: ''},
];

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


const PlayerDashboardPage: React.FC = () => {
    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Hola, MageSlayer92</h1>
                <p className="text-lg text-slate-300 mt-2">
                    Bienvenido a tu panel. Aquí puedes ver tu progreso, historial de torneos y gestionar tus publicaciones.
                </p>
            </div>

            {/* Key Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard icon={<TrophyIcon className="w-8 h-8"/>} title="Ranking The Player" value="1250 pts" rank="1" color="sky" />
                <StatCard icon={<SparklesIcon className="w-8 h-8"/>} title="Ranking Caminante de Planos" value="75.2%" rank="2" color="violet" />
            </section>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Tournament History */}
                <section>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Historial de Torneos</h2>
                     <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Torneo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Resultado (V-D-E)</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Puntos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {mockTournamentHistory.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-700/40">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium text-white">{t.tournamentName}</p>
                                            <p className="text-xs text-slate-400">{t.date} - {t.format}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">{t.result}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-sky-400">+{t.pointsEarned} pts</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                 {/* Marketplace Management */}
                <section>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Mis Publicaciones</h2>
                     <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Publicación</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tipo</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {mockPlayerMarketplacePosts.map(post => (
                                    <tr key={post.id} className="hover:bg-slate-700/40">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{post.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`font-semibold text-xs px-2 py-1 rounded-full ${
                                                post.type === 'Venta' ? 'bg-red-500/20 text-red-300' : 
                                                post.type === 'Compra' ? 'bg-green-500/20 text-green-300' : 
                                                'bg-blue-500/20 text-blue-300'
                                            }`}>
                                                {post.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <button className="p-2 text-slate-400 hover:text-green-400 transition-colors" title="Marcar como Vendido/Completado">
                                                <CheckCircleIcon className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-yellow-400 transition-colors" title="Editar">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

             </div>
        </div>
    );
};

export default PlayerDashboardPage;
