import React from 'react';

const MediaVideosPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-fade-in-up">
            <div className="bg-red-900/20 p-6 rounded-full border border-red-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Sección de Videos
            </h1>
            <p className="text-xl text-slate-400 max-w-lg">
                Estamos preparando contenido audiovisual exclusivo. <br />
                ¡Próximamente entrevistas, análisis y coverage de torneos!
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
        </div>
    );
};

export default MediaVideosPage;
