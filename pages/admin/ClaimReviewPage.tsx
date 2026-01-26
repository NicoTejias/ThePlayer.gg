import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface PendingClaim {
    claim_id: string;
    player_id: string;
    player_name: string;
    player_email: string;
    result_name: string;
    tournament_name: string;
    tournament_date: string;
    pwp_earned: number;
    status: string;
    created_at: string;
}

const ClaimReviewPage: React.FC = () => {
    const [claims, setClaims] = useState<PendingClaim[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState<PendingClaim | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
    const [adminNotes, setAdminNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPendingClaims();
    }, []);

    const fetchPendingClaims = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('admin_get_pending_claims');

            if (error) throw error;
            setClaims(data || []);
        } catch (error: any) {
            console.error('Error fetching claims:', error);
            toast.error('Error al cargar reclamos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const openReviewModal = (claim: PendingClaim, action: 'approve' | 'reject') => {
        setSelectedClaim(claim);
        setReviewAction(action);
        setShowReviewModal(true);
        setAdminNotes('');
    };

    const handleReview = async () => {
        if (!selectedClaim) return;

        setProcessing(true);
        try {
            const { error } = await supabase.rpc('admin_review_claim', {
                p_claim_id: selectedClaim.claim_id,
                p_approve: reviewAction === 'approve',
                p_notes: adminNotes.trim() || null
            });

            if (error) throw error;

            toast.success(`Reclamo ${reviewAction === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`);
            setShowReviewModal(false);
            setSelectedClaim(null);
            setAdminNotes('');
            fetchPendingClaims();
        } catch (error: any) {
            console.error('Error reviewing claim:', error);
            toast.error('Error: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Revisión de Reclamos</h1>
                    <p className="text-slate-400 mt-2 text-sm">Aprueba o rechaza reclamos de resultados de torneos</p>
                </div>
                <Link
                    to="/admin"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 flex items-center gap-2"
                >
                    ← Volver
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase font-bold">Reclamos Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">{claims.length}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase font-bold">Player Points en Revisión</p>
                    <p className="text-2xl font-bold text-sky-400 mt-1">
                        {claims.reduce((sum, c) => sum + (c.pwp_earned || 0), 0)}
                    </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase font-bold">Jugadores Únicos</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">
                        {new Set(claims.map(c => c.player_id)).size}
                    </p>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 mt-4">Cargando reclamos...</p>
                </div>
            )}

            {/* Claims Table */}
            {!loading && claims.length > 0 && (
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Jugador</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Resultado</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Torneo</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Points</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {claims.map((claim) => (
                                    <tr key={claim.claim_id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white font-medium">{claim.player_name}</p>
                                                <p className="text-slate-400 text-xs">{claim.player_email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-white text-sm">{claim.result_name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white text-sm">{claim.tournament_name}</p>
                                                <p className="text-slate-500 text-xs">
                                                    {new Date(claim.tournament_date).toLocaleDateString('es-CL')}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-sky-900/40 text-sky-300 rounded-full text-xs font-bold">
                                                {claim.pwp_earned} Pts
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {new Date(claim.created_at).toLocaleDateString('es-CL')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openReviewModal(claim, 'approve')}
                                                    className="px-3 py-1.5 bg-green-900/50 hover:bg-green-800 text-green-300 rounded text-xs font-medium transition-colors"
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    onClick={() => openReviewModal(claim, 'reject')}
                                                    className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 rounded text-xs font-medium transition-colors"
                                                >
                                                    Rechazar
                                                </button>
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
            {!loading && claims.length === 0 && (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-slate-400 text-lg font-medium">No hay reclamos pendientes</p>
                    <p className="text-slate-500 text-sm mt-2">Todos los reclamos han sido revisados</p>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && selectedClaim && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-lg w-full p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {reviewAction === 'approve' ? 'Aprobar Reclamo' : 'Rechazar Reclamo'}
                        </h2>

                        {/* Claim Details */}
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Jugador:</span>
                                <span className="text-white font-medium">{selectedClaim.player_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Resultado:</span>
                                <span className="text-white">{selectedClaim.result_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Torneo:</span>
                                <span className="text-white">{selectedClaim.tournament_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Player Points:</span>
                                <span className="text-sky-400 font-bold">{selectedClaim.pwp_earned}</span>
                            </div>
                        </div>

                        {/* Admin Notes */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Notas Administrativas (Opcional)
                            </label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="Agrega notas sobre esta decisión..."
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowReviewModal(false)}
                                disabled={processing}
                                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReview}
                                disabled={processing}
                                className={`flex-1 py-2 px-4 font-bold rounded-lg transition-colors disabled:opacity-50 ${reviewAction === 'approve'
                                    ? 'bg-green-600 hover:bg-green-500 text-white'
                                    : 'bg-red-600 hover:bg-red-500 text-white'
                                    }`}
                            >
                                {processing ? 'Procesando...' : reviewAction === 'approve' ? 'Aprobar' : 'Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClaimReviewPage;
