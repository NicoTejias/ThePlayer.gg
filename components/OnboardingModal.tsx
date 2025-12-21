import React from 'react';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoToSettings: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onGoToSettings }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 rounded-xl border border-sky-500/30 shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-sky-900 to-slate-900 p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        ¡Atención Jugador!
                    </h2>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-300 leading-relaxed">
                        Para que tus puntos de torneo se vinculen correctamente a tu cuenta,
                        <span className="font-bold text-sky-400"> es obligatorio registrar tu "Alias"</span> (el nombre exacto que usas en la Companion App o en torneos).
                    </p>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-sm text-slate-400">
                        <p>Sin esto, no podremos asignarte tus victorias ni mostrarte en el Ranking oficial.</p>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onGoToSettings}
                        className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-sky-900/20"
                    >
                        Ir a Configuración
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
                    >
                        Mas tarde
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
