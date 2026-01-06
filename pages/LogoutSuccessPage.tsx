import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const LogoutSuccessPage: React.FC = () => {

    // Auto-redirect to home after 5 seconds if they don't click anything
    useEffect(() => {
        const timer = setTimeout(() => {
            window.location.href = '/#/';
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-md w-full text-center space-y-8 animate-fade-in-up">

                <div className="flex justify-center mb-8">
                    <Logo className="h-16 w-auto" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        ¡Gracias por visitarnos!
                    </h1>
                    <p className="text-xl text-slate-300">
                        Esperamos verte pronto compitiendo de nuevo.
                    </p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-xl">
                    <p className="text-slate-400 text-sm mb-6">
                        Has cerrado sesión correctamente.
                    </p>

                    <Link
                        to="/"
                        className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-bold text-white transition-all duration-200 bg-sky-600 rounded-lg hover:bg-sky-500 hover:shadow-lg hover:shadow-sky-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900"
                    >
                        Volver al Inicio
                    </Link>
                </div>

                <p className="text-xs text-slate-500">
                    Serás redirigido automáticamente en unos segundos...
                </p>
            </div>
        </div>
    );
};

export default LogoutSuccessPage;
