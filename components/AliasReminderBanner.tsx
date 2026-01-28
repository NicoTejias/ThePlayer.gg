import React from 'react';
import { Link } from 'react-router-dom';

interface AliasReminderBannerProps {
    show: boolean;
}

const AliasReminderBanner: React.FC<AliasReminderBannerProps> = ({ show }) => {
    if (!show) return null;

    return (
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl overflow-hidden relative group shadow-2xl shadow-red-900/20 mb-8 border border-white/10 animate-fade-in">
            <div className="p-1 group-hover:bg-white/5 transition-colors">
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 animate-pulse flex-shrink-0">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                ¡Importante: Falta tu Alias de Torneo!
                            </h3>
                            <p className="text-white/90 font-medium max-w-lg mt-1 leading-tight">
                                No has registrado tu <span className="font-bold text-white underline decoration-white/40">Alias (Companion App)</span> en tu perfil. Sin esto, tus victorias no se sumarán al Ranking oficial de la liga.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/settings"
                        className="w-full md:w-auto px-8 py-4 bg-white text-orange-600 font-black rounded-2xl shadow-xl hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 uppercase tracking-wide text-sm text-center flex-shrink-0"
                    >
                        Vincular Alias Ahora
                    </Link>
                </div>
            </div>

            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden select-none">
                <div className="flex flex-wrap gap-x-8 gap-y-4 -rotate-12 scale-150 font-black text-white text-4xl whitespace-nowrap">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <span key={i}>UPDATE ALIAS • COMPANION APP • LINK POINTS • RANKING</span>
                    ))}
                </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 blur-[100px] rounded-full pointer-events-none"></div>
        </div>
    );
};

export default AliasReminderBanner;
