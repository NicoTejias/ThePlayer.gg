import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const SubscriptionSuccessPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Show success message
        toast.success('¡Suscripción activada exitosamente!');

        // Redirect to dashboard after 3 seconds
        const timer = setTimeout(() => {
            navigate('/dashboard');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border-2 border-green-500/30 shadow-2xl shadow-green-900/50 text-center">
                {/* Success Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-4">
                    ¡Pago Exitoso!
                </h1>

                {/* Message */}
                <p className="text-slate-300 mb-6">
                    Tu suscripción a <span className="text-purple-400 font-bold">ThePlayer PRO</span> ha sido activada correctamente.
                </p>

                {/* Features */}
                <div className="bg-slate-900/50 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-slate-400 mb-3">Ahora tienes acceso a:</p>
                    <ul className="space-y-2 text-sm text-slate-300">
                        <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            Dashboard de estadísticas avanzadas
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            Badge PRO en tu perfil
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            Registro prioritario en torneos
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            Contenido exclusivo y más
                        </li>
                    </ul>
                </div>

                {/* Redirect Info */}
                <p className="text-sm text-slate-400 mb-4">
                    Serás redirigido a tu dashboard en unos segundos...
                </p>

                {/* Manual Redirect Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
                >
                    Ir al Dashboard
                </button>
            </div>
        </div>
    );
};

export default SubscriptionSuccessPage;
