import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface InfractionReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournaments?: { id: string; name: string; date: string }[];
}

const InfractionReportModal: React.FC<InfractionReportModalProps> = ({
    isOpen,
    onClose,
    tournaments = []
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        playerName: '',
        tournamentId: '',
        infractionType: 'procedural_error',
        severity: 'warning',
        description: '',
        penaltyApplied: '',
        escalateToCase: false,
        judgeStatement: '',
        witnessStatement: '',
        evidenceUrls: ''
    });

    const infractionTypes = [
        { value: 'procedural_error', label: 'Error de Procedimiento', icon: '📋' },
        { value: 'slow_play', label: 'Juego Lento', icon: '🐢' },
        { value: 'marked_cards', label: 'Cartas Marcadas', icon: '🃏' },
        { value: 'deck_error', label: 'Error de Mazo', icon: '📦' },
        { value: 'unsporting_conduct', label: 'Conducta Antideportiva (Leve)', icon: '😤' },
        { value: 'unsporting_major', label: 'Conducta Antideportiva (Grave)', icon: '🚫' },
        { value: 'cheating', label: 'Trampa Comprobada', icon: '⚠️' },
        { value: 'aggression', label: 'Agresión', icon: '👊' },
        { value: 'other', label: 'Otro', icon: '❓' }
    ];

    const severities = [
        { value: 'caution', label: 'Aviso Verbal', color: 'bg-slate-500' },
        { value: 'warning', label: 'Advertencia', color: 'bg-yellow-500' },
        { value: 'game_loss', label: 'Pérdida de Partida', color: 'bg-orange-500' },
        { value: 'match_loss', label: 'Pérdida de Ronda', color: 'bg-red-500' },
        { value: 'dq', label: 'Descalificación', color: 'bg-red-700' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.playerName.trim()) {
            toast.error('Ingresa el nombre del jugador');
            return;
        }

        if (!formData.description.trim()) {
            toast.error('Ingresa una descripción del incidente');
            return;
        }

        if (formData.escalateToCase && !formData.judgeStatement.trim()) {
            toast.error('La declaración del juez es obligatoria para escalar a caso');
            return;
        }

        setLoading(true);

        try {
            // Create infraction
            const { data: infraction, error: infractionError } = await supabase
                .rpc('create_infraction', {
                    p_player_name: formData.playerName,
                    p_tournament_id: formData.tournamentId || null,
                    p_infraction_type: formData.infractionType,
                    p_severity: formData.severity,
                    p_description: formData.description,
                    p_penalty_applied: formData.penaltyApplied || null
                });

            if (infractionError) throw infractionError;

            // If escalating to case, create discipline case
            if (formData.escalateToCase && formData.severity === 'dq') {
                const { error: caseError } = await supabase
                    .rpc('create_discipline_case', {
                        p_infraction_id: infraction,
                        p_case_type: 'dq_review',
                        p_accused_player_name: formData.playerName,
                        p_judge_statement: formData.judgeStatement,
                        p_witness_statement: formData.witnessStatement || null,
                        p_evidence_urls: formData.evidenceUrls ? formData.evidenceUrls.split('\n').filter(url => url.trim()) : null
                    });

                if (caseError) throw caseError;
                toast.success('Infracción registrada y caso disciplinario creado');
            } else {
                toast.success('Infracción registrada correctamente');
            }

            // Reset form and close
            setFormData({
                playerName: '',
                tournamentId: '',
                infractionType: 'procedural_error',
                severity: 'warning',
                description: '',
                penaltyApplied: '',
                escalateToCase: false,
                judgeStatement: '',
                witnessStatement: '',
                evidenceUrls: ''
            });
            onClose();

        } catch (error: any) {
            console.error('Error creating infraction:', error);
            toast.error(error.message || 'Error al registrar infracción');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-b border-amber-500/50 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">📝</span>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Reportar Infracción</h2>
                                <p className="text-amber-300/70 text-sm">Registro oficial de incidente disciplinario</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            title="Cerrar"
                            className="text-slate-400 hover:text-white transition-colors p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Player Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Nombre del Jugador *
                        </label>
                        <input
                            type="text"
                            value={formData.playerName}
                            onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                            placeholder="Ingresa el nombre completo del jugador"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>

                    {/* Tournament */}
                    {tournaments.length > 0 && (
                        <div>
                            <label htmlFor="tournamentId" className="block text-sm font-semibold text-slate-300 mb-2">
                                Torneo (Opcional)
                            </label>
                            <select
                                id="tournamentId"
                                value={formData.tournamentId}
                                onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">Seleccionar torneo...</option>
                                {tournaments.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.date})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Infraction Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Tipo de Infracción *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {infractionTypes.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, infractionType: type.value })}
                                    className={`p-3 rounded-lg border text-left transition-all ${formData.infractionType === type.value
                                        ? 'bg-amber-600/30 border-amber-500 text-white'
                                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                                        }`}
                                >
                                    <span className="text-lg mr-2">{type.icon}</span>
                                    <span className="text-sm font-medium">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Severity */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Severidad Aplicada *
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {severities.map(sev => (
                                <button
                                    key={sev.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, severity: sev.value })}
                                    className={`px-4 py-2 rounded-lg border font-medium transition-all flex items-center gap-2 ${formData.severity === sev.value
                                        ? 'bg-amber-600/30 border-amber-500 text-white'
                                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                                        }`}
                                >
                                    <span className={`w-3 h-3 rounded-full ${sev.color}`}></span>
                                    {sev.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Descripción del Incidente *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe en detalle lo ocurrido, incluyendo el contexto y las circunstancias..."
                            rows={4}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                            required
                        />
                    </div>

                    {/* Penalty Applied */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Penalidad Aplicada (Opcional)
                        </label>
                        <input
                            type="text"
                            value={formData.penaltyApplied}
                            onChange={(e) => setFormData({ ...formData, penaltyApplied: e.target.value })}
                            placeholder="Ej: Game Loss en el turno 3..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    {/* Escalate to Case (only for DQ) */}
                    {formData.severity === 'dq' && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3 mb-4">
                                <input
                                    type="checkbox"
                                    id="escalateToCase"
                                    checked={formData.escalateToCase}
                                    onChange={(e) => setFormData({ ...formData, escalateToCase: e.target.checked })}
                                    className="w-5 h-5 rounded border-red-500 bg-slate-800 text-red-500 focus:ring-red-500 mt-0.5"
                                />
                                <label htmlFor="escalateToCase" className="text-red-300">
                                    <span className="font-semibold">Escalar a Caso Disciplinario</span>
                                    <p className="text-sm text-red-400/70 mt-1">
                                        Crear un caso para revisión del Comité de Disciplina. Requiere declaración detallada.
                                    </p>
                                </label>
                            </div>

                            {formData.escalateToCase && (
                                <div>
                                    <label className="block text-sm font-semibold text-red-300 mb-2">
                                        Declaración del Juez *
                                    </label>
                                    <textarea
                                        value={formData.judgeStatement}
                                        onChange={(e) => setFormData({ ...formData, judgeStatement: e.target.value })}
                                        placeholder="Declaración técnica detallada sobre la sanción y los hechos que la fundamentan..."
                                        rows={4}
                                        className="w-full bg-slate-900 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                        required
                                    />
                                </div>
                            )}

                            {formData.escalateToCase && (
                                <div className="space-y-4 pt-4 border-t border-red-500/30">
                                    <div>
                                        <label className="block text-sm font-semibold text-red-300 mb-2">
                                            Declaración de Testigo (Opcional)
                                        </label>
                                        <textarea
                                            value={formData.witnessStatement}
                                            onChange={(e) => setFormData({ ...formData, witnessStatement: e.target.value })}
                                            placeholder="Declaración de un tercero u observador imparcial..."
                                            rows={2}
                                            className="w-full bg-slate-900 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-red-300 mb-2">
                                            Enlaces a Pruebas (Fotos/Videos)
                                        </label>
                                        <textarea
                                            value={formData.evidenceUrls}
                                            onChange={(e) => setFormData({ ...formData, evidenceUrls: e.target.value })}
                                            placeholder="Pega aquí los enlaces a las pruebas (uno por línea)..."
                                            rows={2}
                                            className="w-full bg-slate-900 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                        />
                                        <p className="text-xs text-red-400/60 mt-1">
                                            Sube las imágenes a un servicio externo (Imgur, Google Drive) y pega los enlaces.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Registrando...' : 'Registrar Infracción'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InfractionReportModal;
