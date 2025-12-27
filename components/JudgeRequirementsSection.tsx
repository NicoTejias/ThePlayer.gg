import React, { useState } from 'react';
import { certificationLevels } from '../utils/judge-resources';

const JudgeRequirementsSection: React.FC = () => {
    const [expandedLevel, setExpandedLevel] = useState<number | null>(1);

    const toggleLevel = (level: number) => {
        setExpandedLevel(expandedLevel === level ? null : level);
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-16" id="requirements">
            {/* Section Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/50 rounded-full px-4 py-2 mb-4">
                    <span className="text-2xl">📋</span>
                    <span className="text-sm font-semibold text-purple-300">Requisitos de Certificación</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Niveles de Certificación
                </h2>
                <p className="text-lg text-slate-300 max-w-3xl mx-auto">
                    Nuestro programa de certificación tiene tres niveles progresivos. Cada nivel requiere
                    mayor experiencia y conocimiento, preparándote para arbitrar torneos de cualquier escala.
                </p>
            </div>

            {/* Progression Visual */}
            <div className="flex items-center justify-center mb-12 overflow-x-auto pb-4">
                <div className="flex items-center gap-4 min-w-max">
                    {certificationLevels.map((level, index) => (
                        <React.Fragment key={level.level}>
                            <div className="flex flex-col items-center">
                                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-3xl shadow-lg`}>
                                    {level.icon}
                                </div>
                                <div className="mt-2 text-center">
                                    <div className="text-sm font-bold text-white">Nivel {level.level}</div>
                                    <div className="text-xs text-slate-400">{level.name}</div>
                                </div>
                            </div>
                            {index < certificationLevels.length - 1 && (
                                <div className="w-12 h-1 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Certification Levels Accordion */}
            <div className="space-y-4">
                {certificationLevels.map((level) => (
                    <div
                        key={level.level}
                        className={`bg-slate-800 border-2 rounded-xl overflow-hidden transition-all duration-300 ${expandedLevel === level.level
                                ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                                : 'border-slate-700 hover:border-slate-600'
                            }`}
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleLevel(level.level)}
                            className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-750 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-2xl shadow-lg`}>
                                    {level.icon}
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-white">
                                        Nivel {level.level} - {level.name}
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">{level.description}</p>
                                </div>
                            </div>
                            <svg
                                className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${expandedLevel === level.level ? 'rotate-180' : ''
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Requirements List */}
                        {expandedLevel === level.level && (
                            <div className="px-6 pb-6 pt-2 border-t border-slate-700">
                                <h4 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider">
                                    Requisitos
                                </h4>
                                <ul className="space-y-3">
                                    {level.requirements.map((requirement, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center mt-0.5">
                                                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="text-slate-300 flex-1">{requirement}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Action Button */}
                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <button className={`w-full py-3 px-6 bg-gradient-to-r ${level.color} text-white font-bold rounded-lg hover:shadow-lg transition-all`}>
                                        Aplicar para Nivel {level.level}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Additional Info */}
            <div className="mt-12 bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-2xl">
                        💡
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white mb-2">¿Necesitas más información?</h4>
                        <p className="text-slate-300 mb-4">
                            Si tienes dudas sobre los requisitos o el proceso de certificación, no dudes en contactarnos.
                            Nuestro equipo de Head Judges está disponible para ayudarte.
                        </p>
                        <a
                            href="mailto:jueces@theplayer.gg"
                            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            jueces@theplayer.gg
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JudgeRequirementsSection;
