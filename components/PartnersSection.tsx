import React from 'react';

const PartnersSection: React.FC = () => {
    return (
        <div className="bg-slate-800/50 border-t border-slate-700 py-12">
            <div className="container mx-auto px-4">
                <h3 className="text-2xl font-bold text-center text-white mb-8 uppercase tracking-wider">
                    Nuestros Aliados Estratégicos
                </h3>

                <div className="flex flex-wrap justify-center items-center gap-12">
                    {/* StreamCaster Mage */}
                    <a
                        href="https://www.streamcastermage.cl/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group transition-all duration-300 hover:scale-110"
                    >
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 hover:border-sky-500 transition-colors">
                            <img
                                src="/streamcaster-mage-logo.png"
                                alt="StreamCaster Mage - Productora Audiovisual TCG"
                                className="h-24 w-auto object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                            />
                            <p className="text-slate-400 text-sm text-center mt-3 group-hover:text-sky-400 transition-colors">
                                Productora Audiovisual
                            </p>
                        </div>
                    </a>

                    {/* Placeholder for future partners */}
                    <div className="bg-slate-900/30 p-6 rounded-xl border-2 border-dashed border-slate-700 opacity-50">
                        <div className="h-24 w-32 flex items-center justify-center">
                            <span className="text-slate-600 text-sm font-bold">Tu Logo Aquí</span>
                        </div>
                        <p className="text-slate-600 text-xs text-center mt-3">
                            ¿Quieres ser aliado?
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        Colaboramos con las mejores empresas del ecosistema TCG en Chile
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PartnersSection;
