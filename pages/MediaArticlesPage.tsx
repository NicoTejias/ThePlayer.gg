import React from 'react';

const MediaArticlesPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-fade-in-up">
            <div className="bg-blue-900/20 p-6 rounded-full border border-blue-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Artículos y Noticias
            </h1>
            <p className="text-xl text-slate-400 max-w-lg">
                Aquí encontrarás reportes de torneos, análisis del metajuego y columnas de opinión.
                <br /><span className="text-sm text-slate-500 italic">En construcción...</span>
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
        </div>
    );
};

export default MediaArticlesPage;
