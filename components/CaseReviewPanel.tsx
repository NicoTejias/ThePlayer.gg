import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface CaseReviewPanelProps {
    caseId: string;
    onClose: () => void;
    onUpdate: () => void;
}

interface CommitteeMember {
    member_id: string;
    role: string;
    profile: {
        username: string;
        email: string;
        judge_level: string;
    };
    vote?: {
        vote: string;
        reasoning: string;
        voted_at: string;
    };
}

const CaseReviewPanel: React.FC<CaseReviewPanelProps> = ({
    caseId,
    onClose,
    onUpdate
}) => {
    const [loading, setLoading] = useState(true);
    const [caseData, setCaseData] = useState<any>(null);
    const [committee, setCommittee] = useState<CommitteeMember[]>([]);
    const [processing, setProcessing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'discussion' | 'votes'>('details');
    const [conflictConfirmed, setConflictConfirmed] = useState(false);
    const [myCommitteeRecord, setMyCommitteeRecord] = useState<any>(null);

    // Resolution state
    const [resolution, setResolution] = useState('');
    const [sanction, setSanction] = useState('none');
    const [showResolveModal, setShowResolveModal] = useState(false);

    useEffect(() => {
        getCurrentUser();
        fetchCaseDetails();
    }, [caseId]);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

    const fetchCaseDetails = async () => {
        try {
            // Fetch case data with infraction details
            const { data: caseDetails, error: caseError } = await supabase
                .from('discipline_cases')
                .select(`
                    *,
                    infraction:infractions (*),
                    created_by_profile:profiles!created_by(username)
                `)
                .eq('id', caseId)
                .single();

            if (caseError) throw caseError;
            setCaseData(caseDetails);

            // Fetch committee members and their votes
            const { data: members, error: membersError } = await supabase
                .from('discipline_committee')
                .select(`
                    member_id,
                    role,
                    is_recused,
                    profile:profiles!member_id (
                        username,
                        email,
                        judge_level
                    )
                `)
                .eq('case_id', caseId);

            if (membersError) throw membersError;

            // Fetch votes separately and merge
            const { data: votes, error: votesError } = await supabase
                .from('case_votes')
                .select('*')
                .eq('case_id', caseId);

            if (votesError) throw votesError;

            // Merge details
            const committeeWithVotes = members.map(m => ({
                ...m,
                vote: votes.find(v => v.member_id === m.member_id)
            }));

            setCommittee(committeeWithVotes);

            // Find my record if logged in
            if (currentUserId) {
                const myRecord = committeeWithVotes.find(m => m.member_id === currentUserId);
                setMyCommitteeRecord(myRecord);
            }

        } catch (error) {
            console.error('Error fetching case details:', error);
            toast.error('Error al cargar detalles del caso');
        } finally {
            setLoading(false);
        }
    };

    // Update my committee record when committee or user changes
    useEffect(() => {
        if (committee.length > 0 && currentUserId) {
            const myRecord = committee.find(m => m.member_id === currentUserId);
            setMyCommitteeRecord(myRecord);
        }
    }, [committee, currentUserId]);

    const handleResolve = async () => {
        if (!resolution.trim()) {
            toast.error('Debes ingresar una resolución fundamentada');
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .rpc('resolve_discipline_case', {
                    p_case_id: caseId,
                    p_resolution: resolution,
                    p_sanction_recommendation: sanction
                });

            if (error) throw error;

            toast.success('Caso resuelto correctamente');
            onUpdate();
            onClose();

        } catch (error: any) {
            console.error('Error resolving case:', error);
            toast.error(error.message || 'Error al resolver caso');
        } finally {
            setProcessing(false);
        }
    };

    const sanctionOptions = [
        { value: 'none', label: 'Sin sanción adicional' },
        { value: 'formative_feedback', label: 'Feedback Formativo' },
        { value: 'warning', label: 'Advertencia Formal' },
        { value: 'suspension_30d', label: 'Suspensión 30 días' },
        { value: 'suspension_90d', label: 'Suspensión 90 días' },
        { value: 'suspension_1y', label: 'Suspensión 1 año' },
        { value: 'permanent_ban', label: 'Recomendación de Baneo' }
    ];

    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('case_comments')
            .select(`
                *,
                author:profiles(username, judge_level)
            `)
            .eq('case_id', caseId)
            .order('created_at', { ascending: true });

        if (!error && data) setComments(data);
    };

    // Load comments when entering discussion tab
    useEffect(() => {
        if (activeTab === 'discussion') {
            fetchComments();
            // Optional: Subscribe to realtime
        }
    }, [activeTab, caseId]);

    const handleRecuse = async () => {
        if (!confirm('¿Estás seguro de que deseas declararte impedido para este caso? Esta acción es irreversible.')) return;

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('discipline_committee')
                .update({
                    is_recused: true,
                    recusal_reason: 'Self-recused by user'
                })
                .match({ case_id: caseId, member_id: currentUserId });

            if (error) throw error;

            toast.success('Has sido recusado del caso.');
            fetchCaseDetails();

        } catch (error) {
            console.error('Error recusing:', error);
            toast.error('Error al procesar recusación');
        } finally {
            setProcessing(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const { error } = await supabase
                .from('case_comments')
                .insert({
                    case_id: caseId,
                    author_id: currentUserId,
                    content: newComment
                });

            if (error) throw error;

            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error('Error al publicar comentario');
        }
    };

    if (!caseData) return null;

    const isCommitteeMember = !!myCommitteeRecord;
    const isRecused = myCommitteeRecord?.is_recused;

    // If I am a committee member and haven't recused myself, I must confirm no conflict
    // This blocks view until confirmed
    if (isCommitteeMember && !isRecused && !conflictConfirmed) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-amber-500 rounded-xl max-w-lg w-full p-8 text-center shadow-2xl">
                    <span className="text-4xl mb-4 block">⚖️</span>
                    <h2 className="text-2xl font-bold text-white mb-2">Declaración de Imparcialidad</h2>
                    <p className="text-slate-300 mb-6">
                        Para acceder a los detalles confidenciales del caso <strong>{caseData.case_number}</strong>,
                        debes declarar bajo honor que no posees conflictos de interés con las partes involucradas.
                    </p>

                    <div className="bg-slate-900/50 p-4 rounded text-left mb-6 border border-slate-700">
                        <p className="text-sm text-slate-400 mb-2 font-bold uppercase">Partes Involucradas:</p>
                        <ul className="list-disc list-inside text-slate-300">
                            <li>Jugador: <span className="text-white font-medium">{caseData.accused_player_name}</span></li>
                            <li>Juez Reportante: <span className="text-white font-medium">{caseData.created_by_profile?.username || 'Juez desconocido'}</span></li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setConflictConfirmed(true)}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Declaro NO tener conflicto de interés
                        </button>
                        <button
                            onClick={handleRecuse}
                            disabled={processing}
                            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
                        >
                            Tengo un conflicto (Inhabilitarme)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isRecused) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-8 text-center">
                    <span className="text-4xl mb-4 block">🚫</span>
                    <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
                    <p className="text-slate-400">Has declarado conflicto de interés en este caso.</p>
                    <button onClick={onClose} className="mt-6 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600">Cerrar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col">

                {/* Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 z-20 flex flex-col gap-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-white">Revisión de Caso</h2>
                                <span className="px-3 py-1 bg-slate-700 rounded text-sm font-mono text-amber-400">
                                    {caseData.case_number}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm mt-1">
                                Estado: <span className="text-white uppercase font-bold">{caseData.status}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'details' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            📝 Detalles del Caso
                        </button>
                        <button
                            onClick={() => setActiveTab('discussion')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'discussion' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            💬 Discusión {comments.length > 0 && <span className="bg-black/20 px-1.5 rounded-full text-xs">{comments.length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('votes')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'votes' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            🗳️ Votación
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-8 flex-1 overflow-y-auto">

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Infraction Details */}
                            <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">📋</span> Detalles de la Infracción
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Jugador Implicado</label>
                                        <p className="text-white font-semibold text-lg">{caseData.accused_player_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Infracción Original</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-white">{caseData.infraction?.infraction_type}</span>
                                            <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded border border-red-500/30">
                                                {caseData.infraction?.severity}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-slate-500 uppercase font-bold">Descripción del Incidente</label>
                                        <p className="text-slate-300 mt-1 bg-slate-800 p-3 rounded text-sm whitespace-pre-wrap">
                                            {caseData.infraction?.description}
                                        </p>
                                    </div>
                                    {caseData.evidence_urls && caseData.evidence_urls.length > 0 && (
                                        <div className="md:col-span-2">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Evidencia Adjunta</label>
                                            <ul className="mt-2 space-y-1">
                                                {caseData.evidence_urls.map((url: string, i: number) => (
                                                    <li key={i}>
                                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-2">
                                                            📎 {url}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Statements */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-4">Declaración del Juez</h3>
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                                        {caseData.judge_statement}
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    {caseData.accused_statement ? (
                                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
                                            <h3 className="text-lg font-bold text-white mb-4">Descargo del Jugador</h3>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap">
                                                {caseData.accused_statement}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700 flex items-center justify-center text-slate-500 italic h-32">
                                            Sin declaración del jugador
                                        </div>
                                    )}

                                    {caseData.witness_statement && (
                                        <div className="bg-slate-900/50 rounded-lg p-6 border border-orange-500/20">
                                            <h3 className="text-lg font-bold text-orange-200 mb-4">Declaración de Testigo</h3>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap">
                                                {caseData.witness_statement}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DISCUSSION TAB */}
                    {activeTab === 'discussion' && (
                        <div className="h-[500px] flex flex-col bg-slate-900 rounded-lg border border-slate-700">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {comments.length === 0 ? (
                                    <div className="text-center text-slate-500 italic mt-10">
                                        Inicia la discusión sobre este caso...
                                    </div>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className={`flex flex-col ${comment.author_id === currentUserId ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[80%] rounded-lg p-3 ${comment.author_id === currentUserId
                                                    ? 'bg-amber-900/40 border border-amber-500/30 rounded-tr-none'
                                                    : 'bg-slate-800 border border-slate-700 rounded-tl-none'
                                                }`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold ${comment.author_id === currentUserId ? 'text-amber-400' : 'text-slate-300'}`}>
                                                        {comment.author?.username || 'Usuario'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {new Date(comment.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-white text-sm whitespace-pre-wrap">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-700 bg-slate-800 rounded-b-lg">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                        placeholder="Escribe un comentario..."
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50"
                                    >
                                        Enviar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VOTES TAB */}
                    {activeTab === 'votes' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Committee Votes */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">🗳️</span> Votación del Comité
                                </h3>
                                {committee.length > 0 ? (
                                    <div className="grid gap-4">
                                        {committee.map((member) => (
                                            <div key={member.member_id} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-white">{member.profile.username}</span>
                                                            {member.is_recused && (
                                                                <span className="px-2 py-0.5 bg-red-900/50 text-red-400 text-xs rounded border border-red-500/30">RECUSADO</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-500">({member.profile.judge_level})</span>
                                                        {member.role === 'chair' && (
                                                            <span className="ml-2 px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded">Chair</span>
                                                        )}
                                                    </div>
                                                    {!member.is_recused && (
                                                        member.vote ? (
                                                            <span className={`px-3 py-1 rounded text-sm font-bold ${member.vote.vote === 'uphold' ? 'bg-green-900/30 text-green-400' :
                                                                member.vote.vote === 'overturn' ? 'bg-red-900/30 text-red-400' :
                                                                    'bg-blue-900/30 text-blue-400'
                                                                }`}>
                                                                {member.vote.vote.toUpperCase()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500 text-sm italic">Pendiente...</span>
                                                        )
                                                    )}
                                                </div>
                                                {member.is_recused ? (
                                                    <p className="text-slate-500 text-xs italic">
                                                        Este miembro se ha declarado impedido por conflicto de interés.
                                                    </p>
                                                ) : (
                                                    member.vote?.reasoning && (
                                                        <p className="text-slate-300 text-sm border-l-2 border-slate-600 pl-3">
                                                            "{member.vote.reasoning}"
                                                        </p>
                                                    )
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-slate-900/30 rounded-lg border border-slate-700 border-dashed">
                                        <p className="text-slate-400">No hay comité asignado aún.</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {caseData.status !== 'resolved' && (
                                <div className="pt-6 border-t border-slate-700 flex justify-end">
                                    <button
                                        onClick={() => setShowResolveModal(true)}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg"
                                    >
                                        Emitir Resolución Final
                                    </button>
                                </div>
                            )}

                            {/* Final Resolution Display (if resolved) */}
                            {caseData.status === 'resolved' && (
                                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                                    <h3 className="text-lg font-bold text-green-400 mb-2">Resolución Final</h3>
                                    <div className="mb-4">
                                        <span className="text-xs text-green-500/70 uppercase font-bold">Recomendación de Sanción</span>
                                        <p className="text-white font-bold text-lg">
                                            {sanctionOptions.find(o => o.value === caseData.sanction_recommendation)?.label || caseData.sanction_recommendation}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-green-500/70 uppercase font-bold">Fundamentación</span>
                                        <p className="text-green-100 mt-1 whitespace-pre-wrap">{caseData.resolution}</p>
                                    </div>
                                    <div className="mt-4 text-xs text-green-500/50 text-right">
                                        Resuelto el {new Date(caseData.resolved_at).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Resolve Modal Overlay */}
            {showResolveModal && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-lg w-full m-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Emitir Resolución Final</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Recomendación de Sanción
                                </label>
                                <select
                                    value={sanction}
                                    onChange={(e) => setSanction(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    {sanctionOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Fundamentación de la Resolución
                                </label>
                                <textarea
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    placeholder="Escribe la resolución oficial del comité..."
                                    rows={5}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowResolveModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600"
                                    disabled={processing}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleResolve}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:opacity-50"
                                    disabled={processing}
                                >
                                    {processing ? 'Guardando...' : 'Confirmar Resolución'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseReviewPanel;
