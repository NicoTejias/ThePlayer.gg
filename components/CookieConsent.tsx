import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            // Pequeno delay para que la animación se vea bien al cargar
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in-up">
            <div className="max-w-7xl mx-auto">
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">

                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl"></div>

                    <div className="flex items-start gap-4 z-10 w-full md:w-auto">
                        <div className="p-3 bg-sky-500/20 rounded-xl hidden sm:block">
                            <Cookie className="w-6 h-6 text-sky-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                <span className="sm:hidden"><Cookie className="w-5 h-5 text-sky-400 inline" /></span>
                                Usamos Cookies
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                                Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y recordar tus preferencias.
                                Al continuar navegando, aceptas nuestra{' '}
                                <Link to="/reglamento" className="text-sky-400 hover:text-sky-300 font-medium underline decoration-sky-400/30 hover:decoration-sky-400">
                                    Política de Cookies
                                </Link>.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto z-10">
                        {/* 
                        // Opcional: Botón de rechazar o configurar (si se requiere más adelante)
                        <button 
                            onClick={handleAccept} 
                            className="px-6 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-sm"
                        >
                            Cerrar
                        </button> 
                        */}
                        <button
                            onClick={handleAccept}
                            className="w-full md:w-auto px-8 py-3 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/20 hover:shadow-sky-600/20 transform hover:-translate-y-0.5 transition-all duration-200 text-sm whitespace-nowrap"
                        >
                            Aceptar Cookies
                        </button>

                        <button
                            onClick={() => setIsVisible(false)}
                            className="md:hidden absolute top-2 right-2 p-2 text-slate-400 hover:text-white"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
