import React from 'react';
import type { Store, CommunityEvent, Judge } from '../types';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import ClipboardListIcon from '../components/icons/ClipboardListIcon';
import TrophyIcon from '../components/icons/TrophyIcon';
import UsersIcon from '../components/icons/UserIcon';
import ScaleIcon from '../components/icons/ScaleIcon';

// Mock data for Admin Dashboard
const mockPendingStores: Store[] = [
    { id: 's9', name: 'La Guarida del Dragón', region: 'Metropolitana', address: 'Calle Falsa 123', website: '#', logoUrl: '', status: 'Pendiente', requestDate: '2024-07-28' },
    { id: 's10', name: 'El Gato Arcano', region: 'Valparaíso', address: 'Avenida Siempre Viva 742', website: '#', logoUrl: '', status: 'Pendiente', requestDate: '2024-07-27' },
    { id: 's11', name: 'Zona Zero Comics', region: 'Biobío', address: 'Pasaje del Saber 45', website: '#', logoUrl: '', status: 'Pendiente', requestDate: '2024-07-26' },
];

// FIX: Corrected the type to CommunityEvent[], renamed `store` to `storeName`, and removed the unused `imageUrl` property to align with the type definition.
const mockRecentTournaments: CommunityEvent[] = [
    { id: 'e10', title: 'Modern FNM', storeName: 'Magicsur', date: '2024-07-26', format: 'Modern', playerCount: 24 },
    { id: 'e11', title: 'Pioneer Weekly', storeName: 'Guildreams', date: '2024-07-25', format: 'Pioneer', playerCount: 18 },
    { id: 'e12', title: 'Commander Party', storeName: 'Ouroboros Store', date: '2024-07-24', format: 'Commander', playerCount: 32 },
];


const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number, color: string }> = ({ icon, title, value, color }) => (
    <div className={`bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 flex items-center space-x-4`}>
        <div className={`p-3 rounded-full bg-${color}-500/20 text-${color}-400`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400 uppercase">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const AdminDashboardPage: React.FC = () => {
    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Panel de Administración</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Gestiona las tiendas, torneos, usuarios y contenido de theplayer.gg.
                </p>
            </div>

            {/* Key Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<ShieldCheckIcon className="w-8 h-8"/>} title="Tiendas Pendientes" value={mockPendingStores.length} color="yellow" />
                <StatCard icon={<ClipboardListIcon className="w-8 h-8"/>} title="Torneos (Semana)" value={12} color="sky" />
                <StatCard icon={<ScaleIcon className="w-8 h-8"/>} title="Jueces Activos" value={8} color="green" />
                <StatCard icon={<UsersIcon className="w-8 h-8"/>} title="Total Jugadores" value={487} color="violet" />
            </section>

            {/* Main Admin Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Store Approval Section */}
                <section>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Aprobación de Tiendas</h2>
                    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tienda</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Región</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Fecha Solicitud</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {mockPendingStores.map(store => (
                                    <tr key={store.id} className="hover:bg-slate-700/40">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{store.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{store.region}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{store.requestDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors">Aprobar</button>
                                            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors">Rechazar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Recent Tournaments Section */}
                <section>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Últimos Torneos Reportados</h2>
                    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                       <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Torneo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tienda</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jugadores</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {mockRecentTournaments.map(tournament => (
                                    <tr key={tournament.id} className="hover:bg-slate-700/40">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{tournament.title}</td>
                                        {/* FIX: Changed tournament.store to tournament.storeName to conform to the CommunityEvent type. */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tournament.storeName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-300">{tournament.playerCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                             <button className="px-3 py-1 text-xs font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors">Verificar</button>
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

export default AdminDashboardPage;