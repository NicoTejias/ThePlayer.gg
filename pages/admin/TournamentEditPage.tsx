import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

interface Tournament {
    id: string;
    name: string;
    store_name: string;
    date: string;
    format: string;
    player_count: number;
    integrity_status: string;
    created_at: string;
}

const TournamentEditPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const searchTournaments = async () => {
        if (!searchQuery.trim()) {
            toast.error('Ingresa un término de búsqueda');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('admin_search_tournaments', {
                p_query: searchQuery,
                p_limit: 50
            });

            if (error) throw error;
            setTournaments(data || []);

            if (data && data.length === 0) {
                toast.info('No se encontraron torneos');
            }
        } catch (error: any) {
            console.error('Error searching tournaments:', error);
            toast.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (tournament: Tournament) => {
        setSelectedTournament(tournament);
        setShowDeleteModal(true);
        setDeleteReason('');
    };

    const handleDelete = async () => {
        if (!selectedTournament || !deleteReason.trim()) {
            toast.error('La razón es requerida');
            return;
        }

        setProcessing(true);
        try {
            const { data, error } = await supabase.rpc('admin_delete_tournament_safe', {
                p_tournament_id: selectedTournament.id,
                p_reason: deleteReason
            });

            if (error) throw error;

            const affectedPlayers = data?.affected_players || 0;
            toast.success(`Torneo eliminado. ${affectedPlayers} jugador(es) afectado(s). PWP recalculado.`);

            setShowDeleteModal(false);
            setSelectedTournament(null);
            setDeleteReason('');

            // Refresh search results
            searchTournaments();
        } catch (error: any) {
            console.error('Error deleting tournament:', error);
            toast.error('Error: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-900/40 text-yellow-300 rounded-full text-xs font-bold">Pendiente</span>;
            case 'approved':
                return <span className="px-2 py-1 bg-green-900/40 text-green-300 rounded-full text-xs font-bold">Aprobado</span>;
            case 'approved_with_override':
                return <span className="px-2 py-1 bg-blue-900/40 text-blue-300 rounded-full text-xs font-bold">Override</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-900/40 text-red-300 rounded-full text-xs font-bold">Rechazado</span>;
            default:
                return <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Editar Torneos</h1>
                <p className="text-slate-400 mt-2 text-sm">Busca, edita y elimina torneos</p>
            </div>

            {/* Search */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                    Buscar Torneo {searchQuery && <span className="text-slate-500">(mostrando {tournaments.length} resultados)</span>}
                </label>
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="search"
                            placeholder="Busca por nombre del torneo o tienda (ej: 'FNM', 'Modern', 'Tienda X')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-slate-900 text-white placeholder-slate-500 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                        />
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                title="Limpiar búsqueda"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
                <p className="text-slate-500 text-xs mt-2">
                    💡 Deja el campo vacío y presiona "Buscar" para ver todos los torneos
                </p>
            </div>

            {/* Results */}
            {tournaments.length > 0 && (
                <>
                    <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-sm">
                            {tournaments.length} torneo{tournaments.length !== 1 ? 's' : ''} encontrado{tournaments.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900/50 border-b border-slate-700">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Torneo</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tienda</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Formato</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Jugadores</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                                        <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {tournaments.map((tournament) => (
                                        <tr key={tournament.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-white font-medium">{tournament.name}</p>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">{tournament.store_name}</td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {new Date(tournament.date).toLocaleDateString('es-CL')}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">{tournament.format || '-'}</td>
                                            <td className="px-6 py-4 text-white">{tournament.player_count}</td>
                                            <td className="px-6 py-4">{getStatusBadge(tournament.integrity_status)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => toast.info('Edición de resultados individuales próximamente')}
                                                        className="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded text-xs font-medium transition-colors"
                                                    >
                                                        Editar Resultados
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(tournament)}
                                                        className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 rounded text-xs font-medium transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Empty State - After Search */}
            {!loading && tournaments.length === 0 && searchQuery && (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-slate-400 text-lg">No se encontraron torneos</p>
                    <p className="text-slate-500 text-sm mt-2">Intenta con otro término de búsqueda</p>
                    <button
                        onClick={handleClearSearch}
                        className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        Ver todos los torneos
                    </button>
                </div>
            )}

            {/* Empty State - No tournaments at all */}
            {!loading && tournaments.length === 0 && !searchQuery && (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-400 text-lg">No hay torneos en la base de datos</p>
                    <p className="text-slate-500 text-sm mt-2">Los torneos aparecerán aquí cuando se suban desde el panel de tiendas</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedTournament && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-lg w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-900/40 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Eliminar Torneo</h2>
                        </div>

                        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-4">
                            <p className="text-red-300 text-sm font-medium mb-2">⚠️ Esta acción no se puede deshacer</p>
                            <p className="text-slate-400 text-sm">
                                Se eliminarán todos los resultados del torneo y se recalculará el PWP de los jugadores afectados.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-4">
                            <p className="text-slate-400 text-sm mb-1">Torneo:</p>
                            <p className="text-white font-medium">{selectedTournament.name}</p>
                            <p className="text-slate-500 text-xs mt-2">
                                {selectedTournament.store_name} • {new Date(selectedTournament.date).toLocaleDateString('es-CL')} • {selectedTournament.player_count} jugadores
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Razón de la Eliminación *
                            </label>
                            <textarea
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Explica por qué se elimina este torneo..."
                                required
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={processing}
                                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={processing || !deleteReason.trim()}
                                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Eliminando...' : 'Eliminar Torneo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentEditPage;
