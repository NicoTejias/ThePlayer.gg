
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MediaArticle, MediaVideo } from '../types';
import Card from '../components/Card';
import UserIcon from '../components/icons/UserIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import PlayIcon from '../components/icons/PlayIcon';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';

const SectionHeader: React.FC<{ title: string, linkTo: string }> = ({ title, linkTo }) => (
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">{title}</h2>
        <Link to={linkTo} className="text-sky-400 hover:text-sky-300 transition-colors">
            Ver todos &rarr;
        </Link>
    </div>
);

const MediaPage: React.FC = () => {
    const [articles, setArticles] = useState<MediaArticle[]>([]);
    const [videos, setVideos] = useState<MediaVideo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [articlesRes, videosRes] = await Promise.all([
                supabase.from('articles').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(3),
                supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(3)
            ]);

            if (articlesRes.data) {
                setArticles(articlesRes.data.map(a => ({
                    id: a.id,
                    title: a.title,
                    author: a.author_id ? 'The Player' : 'The Player', // Basic fallback
                    excerpt: a.excerpt || '',
                    imageUrl: a.image_url || 'https://picsum.photos/seed/article/400/300',
                    category: a.category || 'General'
                })));
            }

            if (videosRes.data) {
                setVideos(videosRes.data.map(v => ({
                    id: v.id,
                    title: v.title,
                    channel: 'The Player TV',
                    youtubeId: v.youtube_id,
                    thumbnailUrl: `https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`,
                    category: v.game_type || 'General'
                })));
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-16 animate-fade-in-up">
            <SEO
                title="Contenido y Comunidad"
                description="Explora artículos, guías y videos sobre Magic, Pokémon y el mundo de los TCG en Chile."
            />
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Comunidad y Contenido</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Artículos de estrategia, análisis de metajuego, videos y más, creado por y para la comunidad TCG de Chile.
                </p>
            </div>

            {/* Artículos Recientes */}
            <section>
                <SectionHeader title="Artículos Recientes" linkTo="/media/articulos" />
                {articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {articles.map(article => (
                            <Link to={`/media/articulos/${article.id}`} key={article.id}>
                                <Card imageUrl={article.imageUrl} title={article.title}>
                                    <p className="text-slate-400 mb-4 line-clamp-3">{article.excerpt}</p>
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
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                        <p className="text-slate-500">Pronto nuevos artículos de interés.</p>
                    </div>
                )}
            </section>

            {/* Videos Destacados */}
            <section>
                <SectionHeader title="Videos Destacados" linkTo="/media/videos" />
                {videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {videos.map(video => (
                            <a key={video.id} href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer" className="block group">
                                <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-slate-700">
                                    <div className="relative">
                                        <img className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" src={video.thumbnailUrl} alt={video.title} />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <PlayIcon className="w-16 h-16 text-white/80" />
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-bold text-xl mb-3 text-white uppercase group-hover:text-sky-400 transition-colors line-clamp-2">{video.title}</h3>
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
                ) : (
                    <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                        <p className="text-slate-500">Pronto nuevos videos destacados.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default MediaPage;
