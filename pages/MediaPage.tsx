
import React from 'react';
import { Link } from 'react-router-dom';
import type { MediaArticle, MediaVideo } from '../types';
import Card from '../components/Card';
import UserIcon from '../components/icons/UserIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import PlayIcon from '../components/icons/PlayIcon';

// Mock Data for the Media Page
const mockFullArticles: MediaArticle[] = [
    { id: '1', title: 'Análisis del Metajuego Moderno Post-Baneos', author: 'Admin', excerpt: 'Exploramos cómo los últimos cambios han afectado el panorama competitivo de Modern.', imageUrl: 'https://picsum.photos/seed/article1/400/300', category: 'Modern' },
    { id: '2', title: 'Top 5 Cartas de Commander que Deberías Jugar', author: 'Invitado', excerpt: 'Un ranking de las cartas más impactantes y versátiles para tu próximo mazo de Commander.', imageUrl: 'https://picsum.photos/seed/article2/400/300', category: 'Commander' },
    { id: '3', title: 'Guía de Draft: Dominando March of the Machine', author: 'ExpertoLimitado', excerpt: 'Consejos y estrategias para construir mazos ganadores en el último formato de draft.', imageUrl: 'https://picsum.photos/seed/article3/400/300', category: 'Limitado' },
    { id: '4', title: 'Historia de Magic: El Conflicto de los Hermanos', author: 'LoreMaster', excerpt: 'Un viaje al pasado para entender uno de los arcos argumentales más importantes de Magic.', imageUrl: 'https://picsum.photos/seed/article4/400/300', category: 'Lore' },
];

const mockVideos: MediaVideo[] = [
    { id: '1', title: 'Gameplay: Rakdos Scam en Acción (Modern)', channel: 'Canal de Pato', youtubeId: 'dQw4w9WgXcQ', thumbnailUrl: 'https://picsum.photos/seed/video1/400/300', category: 'Modern' },
    { id: '2', title: 'Deck Tech: cEDH con Tymna y Kraum', channel: 'Comandante Informado', youtubeId: 'dQw4w9WgXcQ', thumbnailUrl: 'https://picsum.photos/seed/video2/400/300', category: 'Commander' },
    { id: '3', title: 'Cómo Empezar a Jugar Pauper en 2024', channel: 'El Rincón del Pobre', youtubeId: 'dQw4w9WgXcQ', thumbnailUrl: 'https://picsum.photos/seed/video3/400/300', category: 'Pauper' },
];

const SectionHeader: React.FC<{ title: string, linkTo: string }> = ({ title, linkTo }) => (
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">{title}</h2>
        <Link to={linkTo} className="text-sky-400 hover:text-sky-300 transition-colors">
            Ver todos &rarr;
        </Link>
    </div>
);

const MediaPage: React.FC = () => {
    return (
        <div className="space-y-16">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Comunidad y Contenido</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Artículos de estrategia, análisis de metajuego, videos y más, creado por y para la comunidad TCG de Chile.
                </p>
            </div>

            {/* Artículos Recientes */}
            <section>
                <SectionHeader title="Artículos Recientes" linkTo="/media/articulos" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {mockFullArticles.map(article => (
                        <Card key={article.id} imageUrl={article.imageUrl} title={article.title}>
                            <p className="text-slate-400 mb-4">{article.excerpt}</p>
                            <div className="flex items-center justify-between text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    <span>Por: {article.author}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DocumentTextIcon className="w-4 h-4" />
                                    <span>{article.category}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Videos Destacados */}
            <section>
                <SectionHeader title="Videos Destacados" linkTo="/media/videos" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {mockVideos.map(video => (
                        <a key={video.id} href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer" className="block group">
                            <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-slate-700">
                                <div className="relative">
                                    <img className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" src={video.thumbnailUrl} alt={video.title} />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <PlayIcon className="w-16 h-16 text-white/80" />
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-xl mb-3 text-white uppercase group-hover:text-sky-400 transition-colors">{video.title}</h3>
                                    <div className="flex items-center justify-between text-sm text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <PlayIcon className="w-5 h-5 text-slate-500" />
                                            <span>{video.channel}</span>
                                        </div>
                                        <span className="inline-block bg-slate-700 rounded-full px-3 py-1 text-xs font-semibold text-slate-300">{video.category}</span>
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

export default MediaPage;
