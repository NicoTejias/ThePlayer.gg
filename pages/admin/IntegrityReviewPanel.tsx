import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

interface TournamentWithWarnings {
    tournament_id: string;
    tournament_name: string;
    store_name: string;
    tournament_date: string;
    player_count: number;
    integrity_status: string;
    override_count: number;
    created_at: string;
}

interface Override {
    id: string;
    admin_name: string;
    warning_type: string;
    original_warning: any;
    override_reason: string;
    created_at: string;
}

const IntegrityReviewPanel: React.FC = () => {
    const [tournaments, setTournaments] = useState<TournamentWithWarnings[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState<TournamentWithWarnings | null>(null);
    const [overrides, setOverrides] = useState<Override[]>([]);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('admin_get_tournaments_with_warnings', {
                p_limit: 100
            });

            if (error) throw error;
            setTournaments(data || []);
        } catch (error: any) {
            console.error('Error fetching tournaments:', error);
            toast.error('Error al cargar torneos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const viewOverrides = async (tournament: TournamentWithWarnings) => {
        setSelectedTournament(tournament);
        try {
            const { data, error } = await supabase.rpc('admin_get_tournament_overrides', {
                p_tournament_id: tournament.tournament_id
            });

            if (error) throw error;
            setOverrides(data || []);
        } catch (error: any) {
            console.error('Error fetching overrides:', error);
            toast.error('Error al cargar historial');
        }
    };

    const openOverrideModal = (tournament: TournamentWithWarnings) => {
        setSelectedTournament(tournament);
        setShowOverrideModal(true);
        setOverrideReason('');
    };

    const handleOverride = async () => {
        if (!selectedTournament || !overrideReason.trim()) {
            toast.error('La razón es requerida');
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase.rpc('admin_override_integrity_warning', {
                p_tournament_id: selectedTournament.tournament_id,
                p_warning_type: 'manual_override',
                p_warning_data: { tournament_name: selectedTournament.tournament_name },
                p_reason: overrideReason
            });

            if (error) throw error;

            toast.success('Torneo aprobado con override');
            setShowOverrideModal(false);
            setSelectedTournament(null);
            setOverrideReason('');
            fetchTournaments();
        } catch (error: any) {
            console.error('Error creating override:', error);
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
                return <span className="px-2 py-1 bg-blue-900/40 text-blue-300 rounded-full text-xs font-bold">Aprobado (Override)</span>;
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
                <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Revisión de Integridad</h1>
                <p className="text-slate-400 mt-2 text-sm">Aprueba torneos con advertencias de integridad</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase font-bold">Torneos Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">
                        {tournaments.filter(t => t.integrity_status === 'pending').length}
                    </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase font-bold">Con Override</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">
                        {tournaments.filter(t => t.integrity_status === 'approved_with_override').length}
                    </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase font-bold">Total Overrides</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">
                        {tournaments.reduce((sum, t) => sum + (t.override_count || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 mt-4">Cargando torneos...</p>
                </div>
            )}

            {/* Tournaments Table */}
            {!loading && tournaments.length > 0 && (
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Torneo</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tienda</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Jugadores</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Overrides</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {tournaments.map((tournament) => (
                                    <tr key={tournament.tournament_id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-white font-medium">{tournament.tournament_name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{tournament.store_name}</td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {new Date(tournament.tournament_date).toLocaleDateString('es-CL')}
                                        </td>
                                        <td className="px-6 py-4 text-white">{tournament.player_count}</td>
                                        <td className="px-6 py-4">{getStatusBadge(tournament.integrity_status)}</td>
                                        <td className="px-6 py-4">
                                            {tournament.override_count > 0 ? (
                                                <button
                                                    onClick={() => viewOverrides(tournament)}
                                                    className="text-sky-400 hover:text-sky-300 text-sm font-medium"
                                                >
                                                    {tournament.override_count} override{tournament.override_count > 1 ? 's' : ''}
                                                </button>
                                            ) : (
                                                <span className="text-slate-500 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {tournament.integrity_status === 'pending' && (
                                                    <button
                                                        onClick={() => openOverrideModal(tournament)}
                                                        className="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded text-xs font-medium transition-colors"
                                                    >
                                                        Aprobar Override
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
            {!loading && tournaments.length === 0 && (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-lg">No hay torneos con advertencias</p>
                </div>
            )}

            {/* Override Modal */}
            {showOverrideModal && selectedTournament && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-lg w-full p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Aprobar con Override</h2>

                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-4">
                            <p className="text-slate-400 text-sm mb-1">Torneo:</p>
                            <p className="text-white font-medium">{selectedTournament.tournament_name}</p>
                            <p className="text-slate-500 text-xs mt-2">
                                {selectedTournament.store_name} • {new Date(selectedTournament.tournament_date).toLocaleDateString('es-CL')}
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Razón del Override *
                            </label>
                            <textarea
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="Explica por qué se aprueba este torneo a pesar de las advertencias..."
                                required
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowOverrideModal(false)}
                                disabled={processing}
                                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleOverride}
                                disabled={processing}
                                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Procesando...' : 'Aprobar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overrides History Modal */}
            {selectedTournament && overrides.length > 0 && !showOverrideModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Historial de Overrides</h2>
                        <p className="text-slate-400 mb-6">
                            Torneo: <span className="text-white font-bold">{selectedTournament.tournament_name}</span>
                        </p>

                        <div className="space-y-3">
                            {overrides.map((override) => (
                                <div key={override.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-medium">{override.admin_name}</span>
                                        <span className="text-slate-500 text-xs">
                                            {new Date(override.created_at).toLocaleString('es-CL')}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm italic">"{override.override_reason}"</p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setSelectedTournament(null);
                                setOverrides([]);
                            }}
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

export default IntegrityReviewPanel;
