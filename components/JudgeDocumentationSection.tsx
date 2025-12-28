import React, { useState } from 'react';
import { toast } from 'sonner';
import { judgeDocuments, categoryLabels, categoryIcons, type DocumentResource } from '../utils/judge-resources';

const JudgeDocumentationSection: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedGame, setSelectedGame] = useState<string>('all');

    const categories = ['all', 'rules', 'policies', 'training', 'forms'] as const;

    const filteredDocuments = judgeDocuments.filter(doc => {
        const categoryMatch = selectedCategory === 'all' || doc.category === selectedCategory;
        const gameMatch = selectedGame === 'all' || doc.game === selectedGame || !doc.game;
        return categoryMatch && gameMatch;
    });

    const getCategoryColor = (category: string) => {
        const colors = {
            rules: 'from-blue-500 to-cyan-500',
            policies: 'from-purple-500 to-pink-500',
            training: 'from-green-500 to-emerald-500',
            forms: 'from-orange-500 to-red-500'
        };
        return colors[category as keyof typeof colors] || 'from-slate-500 to-slate-600';
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-16 bg-slate-900/50" id="documentation">
            {/* Section Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/50 rounded-full px-4 py-2 mb-4">
                    <span className="text-2xl">📚</span>
                    <span className="text-sm font-semibold text-blue-300">Recursos y Documentación</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Centro de Recursos
                </h2>
                <p className="text-lg text-slate-300 max-w-3xl mx-auto">
                    Accede a reglas oficiales, políticas de torneo, materiales de entrenamiento y formularios
                    necesarios para tu desarrollo como juez certificado.
                </p>
            </div>

            {/* Filters */}
            <div className="mb-8">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">
                                Categoría
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === 'all'
                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    Todos
                                </button>
                                {categories.slice(1).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === category
                                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {categoryIcons[category]} {categoryLabels[category]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Game Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">
                                Juego
                            </label>
                            <select
                                value={selectedGame}
                                onChange={(e) => setSelectedGame(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todos los Juegos</option>
                                <option value="mtg">Magic: The Gathering</option>
                                <option value="pokemon">Pokémon TCG</option>
                                <option value="lorcana">Lorcana</option>
                                <option value="onepiece">One Piece</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((doc, index) => (
                    <div
                        key={index}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-all group"
                    >
                        {/* Category Badge */}
                        <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${getCategoryColor(doc.category)} bg-opacity-20 border border-current rounded-full px-3 py-1 mb-4`}>
                            <span className="text-lg">{categoryIcons[doc.category]}</span>
                            <span className="text-xs font-semibold">{categoryLabels[doc.category]}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                            {doc.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-slate-400 mb-4">
                            {doc.description}
                        </p>

                        {/* Game Tag */}
                        {doc.game && (
                            <div className="mb-4">
                                <span className="inline-block bg-slate-700 text-slate-300 text-xs font-semibold px-2 py-1 rounded">
                                    {doc.game.toUpperCase()}
                                </span>
                            </div>
                        )}

                        {/* Action Button */}
                        {doc.url ? (
                            <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Ver Documento
                            </a>
                        ) : doc.downloadable ? (
                            <button
                                onClick={() => toast.info('Este documento estará disponible próximamente', {
                                    description: 'Estamos trabajando en digitalizar todos los recursos.'
                                })}
                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Descargar
                            </button>
                        ) : (
                            <span className="text-slate-500 text-sm">Próximamente</span>
                        )}
                    </div>
                ))}
            </div>

            {/* No Results */}
            {filteredDocuments.length === 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-bold text-white mb-2">No se encontraron documentos</h3>
                    <p className="text-slate-400">
                        Intenta cambiar los filtros para ver más resultados
                    </p>
                </div>
            )}
        </div>
    );
};

export default JudgeDocumentationSection;
