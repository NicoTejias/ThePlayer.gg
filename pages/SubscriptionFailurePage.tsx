import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionFailurePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border-2 border-red-500/30 shadow-2xl shadow-red-900/50 text-center">
                {/* Error Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-4">
                    Pago Cancelado
                </h1>

                {/* Message */}
                <p className="text-slate-300 mb-6">
                    Tu pago no pudo ser procesado. No te preocupes, no se realizó ningún cargo.
                </p>

                {/* Possible Reasons */}
                <div className="bg-slate-900/50 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-slate-400 mb-3">Posibles razones:</p>
                    <ul className="space-y-2 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>Cancelaste el proceso de pago</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>Hubo un problema con tu método de pago</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>La sesión expiró</span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
                    >
                        Intentar Nuevamente
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full px-6 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </div>

                {/* Support */}
                <p className="text-xs text-slate-500 mt-6">
                    ¿Necesitas ayuda? Contáctanos en <span className="text-sky-400">soporte@theplayer.gg</span>
                </p>
            </div>
        </div>
    );
};

export default SubscriptionFailurePage;
