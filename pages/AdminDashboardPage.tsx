import React, { useEffect, useState } from 'react';
import type { CommunityEvent } from '../types';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import ClipboardListIcon from '../components/icons/ClipboardListIcon';
import TrophyIcon from '../components/icons/TrophyIcon';
import UsersIcon from '../components/icons/UserIcon';
import ScaleIcon from '../components/icons/ScaleIcon';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

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
    const [pendingStores, setPendingStores] = useState<any[]>([]);
    const [recentTournaments, setRecentTournaments] = useState<CommunityEvent[]>([]);
    const [stats, setStats] = useState({
        pendingStores: 0,
        tournaments: 0,
        activeJudges: 0,
        totalPlayers: 0
    });
    const [loading, setLoading] = useState(true);
    const [confirmAction, setConfirmAction] = useState<{
        show: boolean;
        type: 'approve' | 'reject' | null;
        storeId: string;
        storeName: string;
    }>({ show: false, type: null, storeId: '', storeName: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // Check session first
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            // 1. Fetch Pending Stores
            const { data: storesData, error: storesError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'store')
                .eq('status', 'pending_approval');

            if (storesError) console.error("Error fetching stores:", storesError);
            setPendingStores(storesData || []);

            // 2. Fetch Recent Tournaments
            const { data: tourneysData } = await supabase
                .from('tournaments')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentTournaments(tourneysData?.map(t => ({
                id: t.id,
                title: t.name,
                storeName: t.store_name || 'Unknown',
                date: t.date,
                format: t.format,
                playerCount: t.player_count
            })) || []);

            // 3. Stats
            const { count: playersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player');
            const { count: judgesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'judge');

            setStats({
                pendingStores: storesData?.length || 0,
                tournaments: tourneysData?.length || 0,
                activeJudges: judgesCount || 0,
                totalPlayers: playersCount || 0
            });

        } catch (error) {
            console.error("Error loading admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveStore = async (id: string, name: string) => {
        setConfirmAction({ show: true, type: 'approve', storeId: id, storeName: name });
    };

    const handleRejectStore = async (id: string, name: string) => {
        setConfirmAction({ show: true, type: 'reject', storeId: id, storeName: name });
    };

    const executeAction = async () => {
        const { type, storeId, storeName } = confirmAction;
        setConfirmAction({ show: false, type: null, storeId: '', storeName: '' });

        if (type === 'approve') {
            const { data, error } = await supabase
                .from('profiles')
                .update({ status: 'active' })
                .eq('id', storeId)
                .select();

            if (error) {
                alert("Error al aprobar: " + error.message);
            } else {
                alert(`Tienda ${storeName} aprobada correctamente.`);
                await fetchAdminData();
            }
        } else if (type === 'reject') {
            const { error } = await supabase
                .from('profiles')
                .update({ status: 'rejected' })
                .eq('id', storeId);

            if (error) {
                alert("Error al rechazar: " + error.message);
            } else {
                alert(`Tienda ${storeName} rechazada.`);
                await fetchAdminData();
            }
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Cargando panel de administración...</div>;

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
                <StatCard icon={<ShieldCheckIcon className="w-8 h-8" />} title="Tiendas Pendientes" value={stats.pendingStores} color="yellow" />
                <StatCard icon={<ClipboardListIcon className="w-8 h-8" />} title="Torneos (Recientes)" value={stats.tournaments} color="sky" />
                <StatCard icon={<ScaleIcon className="w-8 h-8" />} title="Jueces Activos" value={stats.activeJudges} color="green" />
                <StatCard icon={<UsersIcon className="w-8 h-8" />} title="Total Jugadores" value={stats.totalPlayers} color="violet" />
            </section>

            {/* Main Admin Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Store Approval Section */}
                <section>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Aprobación de Tiendas</h2>
                    {pendingStores.length > 0 ? (
                        <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tienda</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Región</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Detalles</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {pendingStores.map(store => (
                                        <tr key={store.id} className="hover:bg-slate-700/40">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                {store.username}
                                                <div className="text-xs text-slate-500">{store.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{store.region || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {store.website_url ? <a href={store.website_url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">Ver Web</a> : 'Sin Web'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleApproveStore(store.id, store.username)}
                                                    className="px-3 py-1 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    onClick={() => handleRejectStore(store.id, store.username)}
                                                    className="px-3 py-1 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                                                >
                                                    Rechazar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center text-slate-400">
                            No hay solicitudes de tiendas pendientes.
                        </div>
                    )}
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
                                {recentTournaments.map(tournament => (
                                    <tr key={tournament.id} className="hover:bg-slate-700/40">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{tournament.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tournament.storeName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-300">{tournament.playerCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors">Ver</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Confirmation Modal */}
            {confirmAction.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">
                            {confirmAction.type === 'approve' ? '¿Aprobar Tienda?' : '¿Rechazar Tienda?'}
                        </h3>
                        <p className="text-slate-300">
                            {confirmAction.type === 'approve'
                                ? `¿Estás seguro de aprobar la tienda "${confirmAction.storeName}"? Podrá subir torneos inmediatamente.`
                                : `¿Estás seguro de rechazar la solicitud de "${confirmAction.storeName}"?`
                            }
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setConfirmAction({ show: false, type: null, storeId: '', storeName: '' })}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={executeAction}
                                className={`flex-1 px-4 py-2 text-white font-bold rounded-lg transition-colors ${confirmAction.type === 'approve'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {confirmAction.type === 'approve' ? 'Aprobar' : 'Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;