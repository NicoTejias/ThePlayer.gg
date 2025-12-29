import React from 'react';
import { Link } from 'react-router-dom';

const VisitorWidget: React.FC = () => {
    return (
        <div className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 border-y border-slate-700/50 py-8 md:py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                        Únete a la Comunidad TCG <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">#1</span> de Latinoamérica
                    </h2>
                    <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                        Compite en torneos oficiales, sube en el ranking, conecta con jugadores y tiendas de toda la región.
                    </p>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all">
                            <div className="text-4xl mb-3">🏆</div>
                            <h3 className="text-lg font-bold text-white mb-2">Rankings Oficiales</h3>
                            <p className="text-sm text-slate-400">Sube en el ranking PWP y Win Rate compitiendo en torneos certificados</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all">
                            <div className="text-4xl mb-3">🎯</div>
                            <h3 className="text-lg font-bold text-white mb-2">Eventos Exclusivos</h3>
                            <p className="text-sm text-slate-400">Accede a torneos, RCQs y eventos especiales en toda Latinoamérica</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 hover:border-pink-500/50 transition-all">
                            <div className="text-4xl mb-3">👥</div>
                            <h3 className="text-lg font-bold text-white mb-2">Comunidad Activa</h3>
                            <p className="text-sm text-slate-400">Conecta con miles de jugadores, tiendas y jueces certificados</p>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center">
                        <Link
                            to="/auth?mode=register"
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-2xl shadow-blue-500/30 transition-all transform hover:scale-105 hover:-translate-y-1 border border-white/10"
                        >
                            🚀 Registrarse Gratis
                        </Link>
                        <Link
                            to="/auth?mode=login"
                            className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-slate-500 text-sm">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>100% Gratis</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Sin Publicidad</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Rankings Oficiales</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorWidget;
