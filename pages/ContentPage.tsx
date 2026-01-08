import React from 'react';
import { Link } from 'react-router-dom';

const ContentPage: React.FC = () => {
    const sections = [
        {
            title: 'Únete como Creador',
            description: 'Comparte tu pasión por los TCG con la comunidad más grande de Chile',
            icon: '🎬',
            path: '/creadores',
            color: 'from-purple-600 to-pink-600',
            hoverColor: 'hover:from-purple-500 hover:to-pink-500'
        },
        {
            title: 'Noticias',
            description: 'Las últimas novedades del mundo de los Trading Card Games',
            icon: '📰',
            path: '/media',
            color: 'from-blue-600 to-cyan-600',
            hoverColor: 'hover:from-blue-500 hover:to-cyan-500'
        },
        {
            title: 'Artículos',
            description: 'Estrategias, análisis de meta y guías para mejorar tu juego',
            icon: '📝',
            path: '/media/articulos',
            color: 'from-green-600 to-emerald-600',
            hoverColor: 'hover:from-green-500 hover:to-emerald-500'
        },
        {
            title: 'Videos',
            description: 'Tutoriales, gameplays y contenido exclusivo de la comunidad',
            icon: '🎥',
            path: '/media/videos',
            color: 'from-red-600 to-orange-600',
            hoverColor: 'hover:from-red-500 hover:to-orange-500'
        }
    ];

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-600 mb-6 drop-shadow-lg">
                        CONTENIDO
                    </h1>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        Descubre todo el contenido creado por y para la comunidad de TCG
                    </p>
                </div>

                {/* Content Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                    {sections.map((section, index) => (
                        <Link
                            key={index}
                            to={section.path}
                            className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                        >
                            <div className="p-8">
                                {/* Icon */}
                                <div className="w-16 h-16 mb-6 flex items-center justify-center text-5xl">
                                    {section.icon}
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-400 group-hover:to-purple-500 transition-all">
                                    {section.title}
                                </h2>

                                {/* Description */}
                                <p className="text-slate-400 mb-6 leading-relaxed">
                                    {section.description}
                                </p>

                                {/* CTA Button */}
                                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r ${section.color} ${section.hoverColor} text-white font-bold transition-all shadow-lg`}>
                                    <span>Explorar</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Decorative gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`} />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ContentPage;
