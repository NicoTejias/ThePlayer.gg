import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import JudgeBadge from '../components/JudgeBadge';
import CaseReviewPanel from '../components/CaseReviewPanel';
import { toast } from 'sonner';

interface DisciplineCase {
    id: string;
    case_number: string;
    case_type: string;
    status: string;
    accused_player_name: string;
    created_at: string;
    infraction?: {
        infraction_type: string;
        severity: string;
    };
}

interface Application {
    id: string;
    applicant_id: string;
    game_type: string;
    requested_level: string;
    experience_years: number;
    previous_certifications: string;
    motivation: string;
    referee_contacts: string;
    status: string;
    created_at: string;
    applicant?: {
        username: string;
        email: string;
    };
}

const HeadJudgeDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'applications' | 'cases'>('applications');
    const [applications, setApplications] = useState<Application[]>([]);
    const [cases, setCases] = useState<DisciplineCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (activeTab === 'applications') {
            fetchApplications();
        } else {
            fetchCases();
        }
    }, [activeTab]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('judge_applications')
                .select(`
                    *,
                    applicant:profiles!applicant_id(username, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Error al cargar aplicaciones');
        } finally {
            setLoading(false);
        }
    };

    const fetchCases = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('discipline_cases')
                .select(`
                    id, case_number, case_type, status, accused_player_name, created_at,
                    infraction:infractions (infraction_type, severity)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCases(data || []);
        } catch (error) {
            console.error('Error fetching cases:', error);
            toast.error('Error al cargar casos');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (appId: string) => {
        if (!reviewNotes.trim()) {
            toast.error('Agrega notas de revisión');
            return;
        }

        setProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated');

            const { error } = await supabase.rpc('approve_judge_application', {
                application_id: appId,
                reviewer_id: user.id,
                notes: reviewNotes
            });

            if (error) throw error;

            toast.success('¡Aplicación aprobada!');
            setSelectedApp(null);
            setReviewNotes('');
            fetchApplications();
        } catch (error: any) {
            console.error('Error approving application:', error);
            toast.error(error.message || 'Error al aprobar aplicación');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (appId: string) => {
        if (!reviewNotes.trim()) {
            toast.error('Agrega notas explicando el rechazo');
            return;
        }

        setProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated');

            const { error } = await supabase.rpc('reject_judge_application', {
                application_id: appId,
                reviewer_id: user.id,
                notes: reviewNotes
            });

            if (error) throw error;

            toast.success('Aplicación rechazada');
            setSelectedApp(null);
            setReviewNotes('');
            fetchApplications();
        } catch (error: any) {
            console.error('Error rejecting application:', error);
            toast.error(error.message || 'Error al rechazar aplicación');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { color: string; text: string }> = {
            pending: { color: 'bg-yellow-500/20 text-yellow-300', text: 'Pendiente' },
            approved: { color: 'bg-green-500/20 text-green-300', text: 'Aprobada' },
            rejected: { color: 'bg-red-500/20 text-red-300', text: 'Rechazada' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    const getGameName = (game: string) => {
        const names: Record<string, string> = {
            mtg: 'Magic: The Gathering',
            pokemon: 'Pokémon TCG',
            lorcana: 'Lorcana',
            onepiece: 'One Piece'
        };
        return names[game] || game;
    };

    const pendingApps = applications.filter(app => app.status === 'pending');
    const reviewedApps = applications.filter(app => app.status !== 'pending');

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Cargando aplicaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">👑</span>
                        <h1 className="text-4xl font-bold">Head Judge Dashboard</h1>
                    </div>
                    <p className="text-slate-400">Gestiona aplicaciones de jueces y casos disciplinarios</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`pb-4 px-2 font-bold transition-all ${activeTab === 'applications'
                            ? 'text-purple-400 border-b-2 border-purple-400'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Aplicaciones
                    </button>
                    <button
                        onClick={() => setActiveTab('cases')}
                        className={`pb-4 px-2 font-bold transition-all ${activeTab === 'cases'
                            ? 'text-amber-400 border-b-2 border-amber-400'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Casos Disciplinarios
                    </button>
                </div>

                {/* Content based on Active Tab */}
                {activeTab === 'applications' ? (
                    <>
                        {/* Application Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                                <div className="text-3xl font-bold text-yellow-400 mb-2">{pendingApps.length}</div>
                                <div className="text-slate-400">Pendientes</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                                <div className="text-3xl font-bold text-green-400 mb-2">
                                    {applications.filter(a => a.status === 'approved').length}
                                </div>
                                <div className="text-slate-400">Aprobadas</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                                <div className="text-3xl font-bold text-red-400 mb-2">
                                    {applications.filter(a => a.status === 'rejected').length}
                                </div>
                                <div className="text-slate-400">Rechazadas</div>
                            </div>
                        </div>

                        {/* Pending Applications */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-4">Aplicaciones Pendientes</h2>
                            {pendingApps.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {pendingApps.map(app => (
                                        <div
                                            key={app.id}
                                            className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer"
                                            onClick={() => setSelectedApp(app)}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white mb-1">
                                                        {app.applicant?.username || 'Usuario'}
                                                    </h3>
                                                    <p className="text-sm text-slate-400">{app.applicant?.email}</p>
                                                </div>
                                                <JudgeBadge level={app.requested_level} size="small" />
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-slate-500">Juego:</span>
                                                    <p className="text-white font-semibold">{getGameName(app.game_type)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Experiencia:</span>
                                                    <p className="text-white font-semibold">{app.experience_years} años</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Fecha:</span>
                                                    <p className="text-white font-semibold">
                                                        {new Date(app.created_at).toLocaleDateString('es-CL')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Estado:</span>
                                                    <div className="mt-1">{getStatusBadge(app.status)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
                                    <p className="text-slate-400">No hay aplicaciones pendientes</p>
                                </div>
                            )}
                        </div>

                        {/* Reviewed Applications */}
                        {reviewedApps.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Historial de Revisiones</h2>
                                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-slate-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Aplicante</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Juego</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Nivel</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase">Estado</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {reviewedApps.map(app => (
                                                <tr key={app.id} className="hover:bg-slate-700/40">
                                                    <td className="px-6 py-4 text-white">{app.applicant?.username}</td>
                                                    <td className="px-6 py-4 text-slate-300">{getGameName(app.game_type)}</td>
                                                    <td className="px-6 py-4">
                                                        <JudgeBadge level={app.requested_level} size="small" />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">{getStatusBadge(app.status)}</td>
                                                    <td className="px-6 py-4 text-slate-300">
                                                        {new Date(app.created_at).toLocaleDateString('es-CL')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Case Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                                <div className="text-3xl font-bold text-yellow-400 mb-2">
                                    {cases.filter(c => ['pending', 'under_review', 'deliberating'].includes(c.status)).length}
                                </div>
                                <div className="text-slate-400">Activos</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                                <div className="text-3xl font-bold text-green-400 mb-2">
                                    {cases.filter(c => c.status === 'resolved').length}
                                </div>
                                <div className="text-slate-400">Resueltos</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                                <div className="text-3xl font-bold text-red-400 mb-2">
                                    {cases.filter(c => c.infraction?.severity === 'dq').length}
                                </div>
                                <div className="text-slate-400">Descalificaciones</div>
                            </div>
                        </div>

                        {/* Cases List */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Casos Disciplinarios</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {cases.length > 0 ? cases.map(caseItem => (
                                    <div
                                        key={caseItem.id}
                                        onClick={() => setSelectedCaseId(caseItem.id)}
                                        className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-amber-500/50 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-slate-700 rounded text-sm font-mono text-amber-400">
                                                    {caseItem.case_number}
                                                </span>
                                                <h3 className="text-xl font-bold text-white">
                                                    {caseItem.accused_player_name}
                                                </h3>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${caseItem.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                                                caseItem.status === 'deliberating' ? 'bg-purple-500/20 text-purple-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {caseItem.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-500">Infracción:</span>
                                                <p className="text-white">{caseItem.infraction?.infraction_type}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Severidad:</span>
                                                <p className="text-white capitalize">{caseItem.infraction?.severity?.replace('_', ' ')}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Fecha:</span>
                                                <p className="text-white">
                                                    {new Date(caseItem.created_at).toLocaleDateString('es-CL')}
                                                </p>
                                            </div>
                                            <div className="flex items-end">
                                                <span className="text-amber-400 text-xs hover:underline">
                                                    Ver detalles &rarr;
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-slate-500">
                                        No hay casos registrados
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Review Modal */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-purple-500/50 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Revisar Aplicación</h2>
                                    <p className="text-purple-300 text-sm mt-1">{selectedApp.applicant?.username}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedApp(null);
                                        setReviewNotes('');
                                    }}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-500">Juego</label>
                                    <p className="text-white font-semibold">{getGameName(selectedApp.game_type)}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500">Nivel Solicitado</label>
                                    <div className="mt-1">
                                        <JudgeBadge level={selectedApp.requested_level} size="small" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500">Experiencia</label>
                                    <p className="text-white font-semibold">{selectedApp.experience_years} años</p>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500">Email</label>
                                    <p className="text-white font-semibold">{selectedApp.applicant?.email}</p>
                                </div>
                            </div>

                            {selectedApp.previous_certifications && (
                                <div>
                                    <label className="text-sm text-slate-500">Certificaciones Previas</label>
                                    <p className="text-white">{selectedApp.previous_certifications}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm text-slate-500">Motivación</label>
                                <p className="text-white whitespace-pre-wrap">{selectedApp.motivation}</p>
                            </div>

                            {selectedApp.referee_contacts && (
                                <div>
                                    <label className="text-sm text-slate-500">Referencias</label>
                                    <p className="text-white whitespace-pre-wrap">{selectedApp.referee_contacts}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Notas de Revisión *
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Agrega tus comentarios sobre esta aplicación..."
                                    rows={4}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-700">
                                <button
                                    onClick={() => handleReject(selectedApp.id)}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-all disabled:opacity-50"
                                    disabled={processing}
                                >
                                    {processing ? 'Procesando...' : 'Rechazar'}
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedApp.id)}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50"
                                    disabled={processing}
                                >
                                    {processing ? 'Procesando...' : 'Aprobar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Case Review Modal */}
            {selectedCaseId && (
                <CaseReviewPanel
                    caseId={selectedCaseId}
                    onClose={() => setSelectedCaseId(null)}
                    onUpdate={fetchCases}
                />
            )}
        </div>
    );
};

export default HeadJudgeDashboard;
