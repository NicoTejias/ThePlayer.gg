import React from 'react';
import Card from '../components/Card';
import UserIcon from '../components/icons/UserIcon';
import PlayIcon from '../components/icons/PlayIcon';

const mockPauperArticles = [
    { id: '1', title: 'Introducción a Pauper: Comunes pero Poderosas', author: 'ThePlayer', excerpt: 'Descubre por qué Pauper es uno de los formatos más queridos y accesibles de Magic.', imageUrl: 'https://picsum.photos/seed/pauper1/400/300', category: 'Pauper' },
];

const mockPauperVideos = [
    { id: '1', title: 'Pauper Gameplay: Mono Blue Faeries vs Burn', channel: 'Pauper League', youtubeId: 'dQw4w9WgXcQ', thumbnailUrl: 'https://picsum.photos/seed/pauper-vid/400/300', category: 'Gameplay' },
];

const PauperPage: React.FC = () => {
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Pauper</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Formato construido donde solo se permiten cartas comunes. ¡Estrategia pura con un presupuesto accesible!
                </p>
            </div>

            <section>
                <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-8 border-b border-slate-700 pb-2">Artículos y Guías</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {mockPauperArticles.map(article => (
                        <Card key={article.id} imageUrl={article.imageUrl} title={article.title}>
                            <p className="text-slate-400 mb-4">{article.excerpt}</p>
                            <div className="flex items-center justify-between text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    <span>Por: {article.author}</span>
                                </div>
                                <span className="inline-block bg-slate-800 rounded px-2 py-0.5 text-xs border border-slate-700">{article.category}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-8 border-b border-slate-700 pb-2">Videos y Gameplays</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mockPauperVideos.map(video => (
                        <a key={video.id} href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer" className="block group">
                            <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-slate-700 h-full flex flex-col">
                                <div className="relative">
                                    <img className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" src={video.thumbnailUrl} alt={video.title} />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <PlayIcon className="w-16 h-16 text-white/80" />
                                    </div>
                                </div>
                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="font-bold text-lg mb-2 text-white uppercase group-hover:text-sky-400 transition-colors">{video.title}</h3>
                                    <div className="flex items-center justify-between text-sm text-slate-400 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <PlayIcon className="w-4 h-4 text-slate-500" />
                                            <span>{video.channel}</span>
                                        </div>
                                        <span className="inline-block bg-slate-700/50 rounded-full px-2 py-0.5 text-xs border border-slate-600/50">{video.category}</span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default PauperPage;
