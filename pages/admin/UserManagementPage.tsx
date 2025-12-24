import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    account_status: string;
    suspension_reason: string | null;
    suspended_until: string | null;
    region: string;
    total_pwp: number;
    created_at: string;
    last_login: string | null;
    listing_count: number;
    tournament_count: number;
}

interface ActionHistory {
    id: string;
    admin_name: string;
    action_type: string;
    reason: string;
    metadata: any;
    created_at: string;
}

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterRole, setFilterRole] = useState('');

    // Modal states
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'suspend' | 'ban' | 'activate'>('suspend');
    const [actionReason, setActionReason] = useState('');
    const [suspensionDays, setSuspensionDays] = useState(7);
    const [actionHistory, setActionHistory] = useState<ActionHistory[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [searchQuery, filterStatus, filterRole]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('admin_search_users', {
                p_query: searchQuery || null,
                p_status: filterStatus || null,
                p_role: filterRole || null,
                p_limit: 100
            });

            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            toast.error('Error al cargar usuarios: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!selectedUser) return;
        if (!actionReason.trim() && actionType !== 'activate') {
            toast.error('La razón es requerida');
            return;
        }

        try {
            let result;

            if (actionType === 'suspend') {
                result = await supabase.rpc('admin_suspend_user', {
                    p_user_id: selectedUser.id,
                    p_reason: actionReason,
                    p_duration_days: suspensionDays
                });
            } else if (actionType === 'ban') {
                result = await supabase.rpc('admin_ban_user', {
                    p_user_id: selectedUser.id,
                    p_reason: actionReason
                });
            } else if (actionType === 'activate') {
                result = await supabase.rpc('admin_activate_user', {
                    p_user_id: selectedUser.id,
                    p_reason: actionReason || 'Cuenta reactivada'
                });
            }

            if (result?.error) throw result.error;

            toast.success(`Usuario ${actionType === 'suspend' ? 'suspendido' : actionType === 'ban' ? 'baneado' : 'activado'} exitosamente`);
            setShowActionModal(false);
            setActionReason('');
            fetchUsers();
        } catch (error: any) {
            console.error('Error performing action:', error);
            toast.error('Error: ' + error.message);
        }
    };

    const openActionModal = (user: User, type: 'suspend' | 'ban' | 'activate') => {
        setSelectedUser(user);
        setActionType(type);
        setShowActionModal(true);
    };

    const viewHistory = async (user: User) => {
        setSelectedUser(user);
        try {
            const { data, error } = await supabase.rpc('admin_get_user_action_history', {
                p_user_id: user.id,
                p_limit: 50
            });

            if (error) throw error;
            setActionHistory(data || []);
            setShowHistoryModal(true);
        } catch (error: any) {
            console.error('Error fetching history:', error);
            toast.error('Error al cargar historial');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 bg-green-900/40 text-green-300 rounded-full text-xs font-bold">Activo</span>;
            case 'suspended':
                return <span className="px-2 py-1 bg-yellow-900/40 text-yellow-300 rounded-full text-xs font-bold">Suspendido</span>;
            case 'banned':
                return <span className="px-2 py-1 bg-red-900/40 text-red-300 rounded-full text-xs font-bold">Baneado</span>;
            default:
                return <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span className="px-2 py-1 bg-purple-900/40 text-purple-300 rounded-full text-xs font-bold">Admin</span>;
            case 'store':
                return <span className="px-2 py-1 bg-blue-900/40 text-blue-300 rounded-full text-xs font-bold">Tienda</span>;
            case 'player':
                return <span className="px-2 py-1 bg-sky-900/40 text-sky-300 rounded-full text-xs font-bold">Jugador</span>;
            default:
                return <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-bold">{role}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Gestión de Usuarios</h1>
                <p className="text-slate-400 mt-2 text-sm">Administra usuarios, suspensiones y permisos</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <input
                    type="search"
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-slate-900 text-white placeholder-slate-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700 text-sm"
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-900 text-white rounded px-4 py-2 focus:outline-none border border-slate-700 text-sm"
                >
                    <option value="">Todos los Estados</option>
                    <option value="active">Activos</option>
                    <option value="suspended">Suspendidos</option>
                    <option value="banned">Baneados</option>
                </select>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="bg-slate-900 text-white rounded px-4 py-2 focus:outline-none border border-slate-700 text-sm"
                >
                    <option value="">Todos los Roles</option>
                    <option value="player">Jugadores</option>
                    <option value="store">Tiendas</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase font-bold">Total Usuarios</p>
                    <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase font-bold">Activos</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                        {users.filter(u => u.account_status === 'active').length}
                    </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase font-bold">Suspendidos</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">
                        {users.filter(u => u.account_status === 'suspended').length}
                    </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase font-bold">Baneados</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                        {users.filter(u => u.account_status === 'banned').length}
                    </p>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 mt-4">Cargando usuarios...</p>
                </div>
            )}

            {/* Users Table */}
            {!loading && users.length > 0 && (
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">PWP</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Torneos</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Listings</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white font-medium">{user.username}</p>
                                                <p className="text-slate-400 text-xs">{user.email}</p>
                                                {user.region && <p className="text-slate-500 text-xs mt-0.5">{user.region}</p>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(user.account_status)}
                                            {user.suspended_until && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Hasta: {new Date(user.suspended_until).toLocaleDateString('es-CL')}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-white">{user.total_pwp || 0}</td>
                                        <td className="px-6 py-4 text-slate-300">{user.tournament_count || 0}</td>
                                        <td className="px-6 py-4 text-slate-300">{user.listing_count || 0}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => viewHistory(user)}
                                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-medium transition-colors"
                                                    title="Ver historial"
                                                >
                                                    Historial
                                                </button>
                                                {user.account_status === 'active' && user.role !== 'admin' && (
                                                    <>
                                                        <button
                                                            onClick={() => openActionModal(user, 'suspend')}
                                                            className="px-3 py-1.5 bg-yellow-900/50 hover:bg-yellow-800 text-yellow-300 rounded text-xs font-medium transition-colors"
                                                        >
                                                            Suspender
                                                        </button>
                                                        <button
                                                            onClick={() => openActionModal(user, 'ban')}
                                                            className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 rounded text-xs font-medium transition-colors"
                                                        >
                                                            Banear
                                                        </button>
                                                    </>
                                                )}
                                                {(user.account_status === 'suspended' || user.account_status === 'banned') && (
                                                    <button
                                                        onClick={() => openActionModal(user, 'activate')}
                                                        className="px-3 py-1.5 bg-green-900/50 hover:bg-green-800 text-green-300 rounded text-xs font-medium transition-colors"
                                                    >
                                                        Activar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && users.length === 0 && (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-lg">No se encontraron usuarios</p>
                </div>
            )}

            {/* Action Modal */}
            {showActionModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {actionType === 'suspend' ? 'Suspender Usuario' : actionType === 'ban' ? 'Banear Usuario' : 'Activar Usuario'}
                        </h2>
                        <p className="text-slate-400 mb-4">
                            Usuario: <span className="text-white font-bold">{selectedUser.username}</span>
                        </p>

                        {actionType === 'suspend' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Duración (días)</label>
                                <input
                                    type="number"
                                    value={suspensionDays}
                                    onChange={(e) => setSuspensionDays(parseInt(e.target.value) || 1)}
                                    min="1"
                                    max="365"
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Razón {actionType !== 'activate' && '*'}
                            </label>
                            <textarea
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="Explica la razón de esta acción..."
                                required={actionType !== 'activate'}
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowActionModal(false)}
                                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAction}
                                className={`flex-1 py-2 px-4 font-bold rounded-lg transition-colors ${actionType === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-500' :
                                        actionType === 'ban' ? 'bg-red-600 hover:bg-red-500' :
                                            'bg-green-600 hover:bg-green-500'
                                    } text-white`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Historial de Acciones</h2>
                        <p className="text-slate-400 mb-6">
                            Usuario: <span className="text-white font-bold">{selectedUser.username}</span>
                        </p>

                        {actionHistory.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No hay acciones registradas</p>
                        ) : (
                            <div className="space-y-3">
                                {actionHistory.map((action) => (
                                    <div key={action.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="px-2 py-1 bg-sky-900/40 text-sky-300 rounded text-xs font-bold uppercase">
                                                {action.action_type}
                                            </span>
                                            <span className="text-slate-500 text-xs">
                                                {new Date(action.created_at).toLocaleString('es-CL')}
                                            </span>
                                        </div>
                                        <p className="text-white text-sm mb-1">
                                            Admin: <span className="font-bold">{action.admin_name}</span>
                                        </p>
                                        {action.reason && (
                                            <p className="text-slate-400 text-sm italic">"{action.reason}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setShowHistoryModal(false)}
                            className="w-full mt-6 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
