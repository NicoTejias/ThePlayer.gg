import React from 'react';
import { Link } from 'react-router-dom';

interface DisciplineSectionProps {
    isJudge?: boolean;
    isOrganizer?: boolean;
    onReportClick?: () => void;
    onHistoryClick?: () => void;
    caseStats?: {
        pending: number;
        resolved: number;
        totalInfractions: number;
    };
}

const DisciplineSection: React.FC<DisciplineSectionProps> = ({
    isJudge = false,
    isOrganizer = false,
    onReportClick,
    onHistoryClick,
    caseStats = { pending: 0, resolved: 0, totalInfractions: 0 }
}) => {
    return (
        <div className="max-w-7xl mx-auto px-6 py-12" id="discipline">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 rounded-full px-4 py-2 mb-6">
                    <span className="text-2xl">🛡️</span>
                    <span className="text-sm font-semibold text-amber-300">Programa de Integridad</span>
                </div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    Comité de Disciplina
                </h2>
                <p className="text-slate-300 max-w-3xl mx-auto">
                    Sistema de registro y revisión de infracciones para garantizar la integridad
                    del juego competitivo. Un ente consultivo imparcial que analiza casos y emite
                    recomendaciones a la comunidad.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{caseStats.totalInfractions}</div>
                    <div className="text-slate-400 text-sm">Infracciones Registradas</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400 mb-1">{caseStats.pending}</div>
                    <div className="text-slate-400 text-sm">Casos Pendientes</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold text-green-400 mb-1">{caseStats.resolved}</div>
                    <div className="text-slate-400 text-sm">Casos Resueltos</div>
                </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Left - Información */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="text-2xl">⚖️</span>
                        Funciones del Comité
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-purple-400 text-xs">1</span>
                            </div>
                            <div>
                                <div className="text-white font-semibold">Supervisión y Apelación</div>
                                <div className="text-slate-400 text-sm">Tribunal de revisión para quejas sobre arbitraje</div>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-purple-400 text-xs">2</span>
                            </div>
                            <div>
                                <div className="text-white font-semibold">Análisis de Patrones</div>
                                <div className="text-slate-400 text-sm">Tracking de infracciones para detectar conductas sistemáticas</div>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-purple-400 text-xs">3</span>
                            </div>
                            <div>
                                <div className="text-white font-semibold">Revisión de DQs</div>
                                <div className="text-slate-400 text-sm">Análisis de proporcionalidad de sanciones</div>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Right - Proceso */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="text-2xl">📋</span>
                        Proceso de Revisión
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-sky-400 font-bold">1</span>
                            </div>
                            <div className="flex-1 h-px bg-slate-700"></div>
                            <div className="text-slate-300 text-sm">Reporte del incidente</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-sky-400 font-bold">2</span>
                            </div>
                            <div className="flex-1 h-px bg-slate-700"></div>
                            <div className="text-slate-300 text-sm">Asignación de comisión (3 miembros)</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-sky-400 font-bold">3</span>
                            </div>
                            <div className="flex-1 h-px bg-slate-700"></div>
                            <div className="text-slate-300 text-sm">Deliberación (7 días)</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-green-400 font-bold">✓</span>
                            </div>
                            <div className="flex-1 h-px bg-slate-700"></div>
                            <div className="text-slate-300 text-sm">Resolución y recomendación</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Acciones Disponibles</h3>
                        <p className="text-amber-200/70 text-sm">
                            {isJudge || isOrganizer
                                ? "Como árbitro u organizador, puedes reportar infracciones y consultar historiales."
                                : "Los jueces y organizadores certificados pueden acceder al sistema de reportes."
                            }
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {isJudge && (
                            <button
                                onClick={onReportClick}
                                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Reportar Infracción
                            </button>
                        )}
                        {(isJudge || isOrganizer) && (
                            <button
                                onClick={onHistoryClick}
                                className="px-6 py-3 bg-slate-700 border border-slate-600 text-white font-bold rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Consultar Historial
                            </button>
                        )}
                        {!isJudge && !isOrganizer && (
                            <Link
                                to="/jueces#requirements"
                                className="px-6 py-3 bg-slate-700 border border-slate-600 text-white font-bold rounded-lg hover:bg-slate-600 transition-all"
                            >
                                Convertirse en Juez
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 text-center text-slate-500 text-sm">
                <p>
                    ⚠️ El Comité actúa como ente consultivo. Las resoluciones son recomendaciones
                    sin facultades coercitivas sobre los organizadores.
                </p>
            </div>
        </div>
    );
};

export default DisciplineSection;
