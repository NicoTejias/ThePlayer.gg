import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface PlayerHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface InfractionRecord {
    infraction_id: string;
    infraction_type: string;
    severity: string;
    description: string;
    tournament_name: string | null;
    reported_date: string;
    case_id: string | null;
    case_status: string | null;
    sanction_recommendation: string | null;
}

const PlayerHistoryModal: React.FC<PlayerHistoryModalProps> = ({
    isOpen,
    onClose
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<InfractionRecord[]>([]);
    const [searched, setSearched] = useState(false);

    const infractionTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
        procedural_error: { label: 'Error de Procedimiento', icon: '📋', color: 'text-blue-400' },
        slow_play: { label: 'Juego Lento', icon: '🐢', color: 'text-yellow-400' },
        marked_cards: { label: 'Cartas Marcadas', icon: '🃏', color: 'text-orange-400' },
        deck_error: { label: 'Error de Mazo', icon: '📦', color: 'text-purple-400' },
        unsporting_conduct: { label: 'Conducta Antideportiva', icon: '😤', color: 'text-orange-400' },
        unsporting_major: { label: 'Conducta Antideportiva Grave', icon: '🚫', color: 'text-red-400' },
        cheating: { label: 'Trampa', icon: '⚠️', color: 'text-red-500' },
        aggression: { label: 'Agresión', icon: '👊', color: 'text-red-600' },
        other: { label: 'Otro', icon: '❓', color: 'text-slate-400' }
    };

    const severityLabels: Record<string, { label: string; color: string }> = {
        caution: { label: 'Aviso', color: 'bg-slate-500/20 text-slate-300' },
        warning: { label: 'Advertencia', color: 'bg-yellow-500/20 text-yellow-300' },
        game_loss: { label: 'Game Loss', color: 'bg-orange-500/20 text-orange-300' },
        match_loss: { label: 'Match Loss', color: 'bg-red-500/20 text-red-300' },
        dq: { label: 'DQ', color: 'bg-red-700/20 text-red-400' }
    };

    const sanctionLabels: Record<string, string> = {
        none: 'Sin sanción adicional',
        formative_feedback: 'Feedback formativo',
        warning: 'Advertencia formal',
        suspension_30d: 'Suspensión 30 días',
        suspension_90d: 'Suspensión 90 días',
        suspension_1y: 'Suspensión 1 año',
        permanent_ban: 'Baneo permanente (sugerido)'
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error('Ingresa un nombre para buscar');
            return;
        }

        setLoading(true);
        setSearched(true);

        try {
            const { data, error } = await supabase
                .rpc('get_player_discipline_history', {
                    p_player_name: searchQuery.trim()
                });

            if (error) throw error;
            setHistory(data || []);

        } catch (error: any) {
            console.error('Error fetching player history:', error);
            toast.error(error.message || 'Error al buscar historial');
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Check for patterns
    const getPatternWarning = () => {
        if (history.length < 3) return null;

        // Check for repeated infractions of same type
        const typeCounts: Record<string, number> = {};
        history.forEach(h => {
            typeCounts[h.infraction_type] = (typeCounts[h.infraction_type] || 0) + 1;
        });

        const repeatedTypes = Object.entries(typeCounts)
            .filter(([_, count]) => count >= 3)
            .map(([type, count]) => ({
                type: infractionTypeLabels[type]?.label || type,
                count
            }));

        if (repeatedTypes.length > 0) {
            return {
                level: 'warning',
                message: `Patrón detectado: ${repeatedTypes.map(r => `${r.type} (${r.count}x)`).join(', ')}`
            };
        }

        if (history.length >= 5) {
            return {
                level: 'caution',
                message: `Historial extenso: ${history.length} infracciones registradas`
            };
        }

        return null;
    };

    const patternWarning = getPatternWarning();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 border-b border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🔍</span>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Consultar Historial</h2>
                                <p className="text-slate-400 text-sm">Buscar antecedentes disciplinarios de un jugador</p>
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

                    {/* Search Bar */}
                    <div className="mt-6 flex gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nombre del jugador..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="px-6 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!searched ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-slate-400">Ingresa un nombre para buscar su historial disciplinario</p>
                        </div>
                    ) : loading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400">Buscando historial...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Sin antecedentes</h3>
                            <p className="text-slate-400">No se encontraron infracciones para "{searchQuery}"</p>
                        </div>
                    ) : (
                        <>
                            {/* Pattern Warning */}
                            {patternWarning && (
                                <div className={`mb-6 p-4 rounded-lg border ${patternWarning.level === 'warning'
                                    ? 'bg-red-900/20 border-red-500/30 text-red-300'
                                    : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{patternWarning.level === 'warning' ? '⚠️' : '👁️'}</span>
                                        <span className="font-semibold">{patternWarning.message}</span>
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Resumen para: {searchQuery}
                                </h3>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-white">{history.length}</div>
                                        <div className="text-slate-400 text-sm">Infracciones</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-red-400">
                                            {history.filter(h => h.severity === 'dq').length}
                                        </div>
                                        <div className="text-slate-400 text-sm">DQs</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-yellow-400">
                                            {history.filter(h => h.case_id).length}
                                        </div>
                                        <div className="text-slate-400 text-sm">Casos</div>
                                    </div>
                                </div>
                            </div>

                            {/* History List */}
                            <div className="space-y-4">
                                {history.map((record, index) => {
                                    const typeInfo = infractionTypeLabels[record.infraction_type] || infractionTypeLabels.other;
                                    const sevInfo = severityLabels[record.severity] || severityLabels.warning;

                                    return (
                                        <div
                                            key={record.infraction_id || index}
                                            className="bg-slate-900 border border-slate-700 rounded-lg p-4"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{typeInfo.icon}</span>
                                                    <span className={`font-semibold ${typeInfo.color}`}>
                                                        {typeInfo.label}
                                                    </span>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sevInfo.color}`}>
                                                    {sevInfo.label}
                                                </span>
                                            </div>

                                            <p className="text-slate-300 text-sm mb-3">{record.description}</p>

                                            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                                <span>
                                                    📅 {new Date(record.reported_date).toLocaleDateString('es-CL')}
                                                </span>
                                                {record.tournament_name && (
                                                    <span>🏆 {record.tournament_name}</span>
                                                )}
                                                {record.case_id && (
                                                    <span className="text-amber-400">
                                                        📋 Caso: {record.case_status}
                                                    </span>
                                                )}
                                                {record.sanction_recommendation && record.sanction_recommendation !== 'none' && (
                                                    <span className="text-red-400">
                                                        ⚖️ {sanctionLabels[record.sanction_recommendation] || record.sanction_recommendation}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-700/50 border-t border-slate-700 p-4">
                    <p className="text-slate-500 text-xs text-center">
                        ⚠️ Esta información es confidencial y solo para uso de jueces y organizadores autorizados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PlayerHistoryModal;
