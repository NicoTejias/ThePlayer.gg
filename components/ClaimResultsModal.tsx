import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface UnclaimedResult {
    tournament_result_name: string;
    tournament_id: string;
    tournament_name: string;
    tournament_date: string;
    pwp_earned: number;
    match_count: number;
}

interface ClaimResultsModalProps {
    isOpen: boolean;
    unclaimedResults: UnclaimedResult[];
    onClose: () => void;
    onClaimProcessed: () => void;
}

const ClaimResultsModal: React.FC<ClaimResultsModalProps> = ({
    isOpen,
    unclaimedResults,
    onClose,
    onClaimProcessed
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || unclaimedResults.length === 0) return null;

    const currentResult = unclaimedResults[currentIndex];

    const handleClaim = async (accept: boolean) => {
        setIsProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.rpc('claim_tournament_result', {
                p_player_id: user.id,
                p_result_name: currentResult.tournament_result_name,
                p_accept: accept
            });

            if (error) throw error;

            // Si es el último resultado, cerrar el modal
            if (currentIndex >= unclaimedResults.length - 1) {
                onClaimProcessed();
                onClose();
            } else {
                // Ir al siguiente resultado
                setCurrentIndex(currentIndex + 1);
            }
        } catch (error: any) {
            console.error('Error claiming result:', error);
            alert('Error al procesar la reclamación: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl w-full p-8 space-y-6 animate-in slide-in-from-bottom-4">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-sky-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                        ¿Estos resultados son tuyos?
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Encontramos {unclaimedResults.length} resultado{unclaimedResults.length > 1 ? 's' : ''} que podría{unclaimedResults.length > 1 ? 'n' : ''} pertenecer a tu cuenta
                    </p>
                </div>

                {/* Progress Indicator */}
                {unclaimedResults.length > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {unclaimedResults.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all ${idx === currentIndex
                                        ? 'w-8 bg-sky-500'
                                        : idx < currentIndex
                                            ? 'w-1.5 bg-emerald-500'
                                            : 'w-1.5 bg-slate-700'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Result Card */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Torneo</p>
                            <p className="text-white font-bold text-lg">{currentResult.tournament_name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Fecha</p>
                            <p className="text-slate-300 text-sm">{formatDate(currentResult.tournament_date)}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Nombre en el torneo</p>
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                            <p className="text-sky-400 font-bold text-xl text-center">
                                "{currentResult.tournament_result_name}"
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">PWP Ganados</p>
                            <p className="text-2xl font-black text-emerald-400">{currentResult.pwp_earned}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Apariciones</p>
                            <p className="text-2xl font-black text-violet-400">{currentResult.match_count}</p>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-blue-300">
                        <span className="font-bold">💡 ¿Qué significa esto?</span><br />
                        Si confirmas, crearemos automáticamente un alias con este nombre y vincularemos todos tus resultados pasados.
                        Tus puntos se actualizarán inmediatamente.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-2">
                    <button
                        onClick={() => handleClaim(false)}
                        disabled={isProcessing}
                        className="flex-1 py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                        No, no soy yo
                    </button>
                    <button
                        onClick={() => handleClaim(true)}
                        disabled={isProcessing}
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                        {isProcessing ? 'Procesando...' : 'Sí, soy yo'}
                    </button>
                </div>

                {/* Skip All */}
                {unclaimedResults.length > 1 && (
                    <button
                        onClick={onClose}
                        className="w-full text-sm text-slate-500 hover:text-slate-300 underline transition-colors"
                    >
                        Revisar esto más tarde
                    </button>
                )}
            </div>
        </div>
    );
};

export default ClaimResultsModal;
