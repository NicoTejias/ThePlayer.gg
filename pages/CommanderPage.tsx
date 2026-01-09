import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Card from '../components/Card';
import UserIcon from '../components/icons/UserIcon';
import PlayIcon from '../components/icons/PlayIcon';
import type { MediaArticle, MediaVideo } from '../types';
import { toast } from 'sonner';

const CommanderPage: React.FC = () => {
    const [articles, setArticles] = useState<MediaArticle[]>([]);
    const [videos, setVideos] = useState<MediaVideo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Articles (MTG only, Published only)
                const { data: articlesData, error: articlesError } = await supabase
                    .from('articles')
                    .select('*')
                    .eq('game_type', 'mtg')
                    .eq('is_published', true)
                    .order('created_at', { ascending: false });

                if (articlesError) throw articlesError;

                // Fetch Videos (MTG only)
                const { data: videosData, error: videosError } = await supabase
                    .from('videos')
                    .select('*')
                    .eq('game_type', 'mtg')
                    .order('created_at', { ascending: false });

                if (videosError) throw videosError;

                setArticles(articlesData || []);
                setVideos(videosData || []);

            } catch (error) {
                console.error('Error fetching commander content:', error);
                // toast.error('Error al cargar contenido'); // Optional: silent fail or toast
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper to extract clean youtube ID
    const getYoutubeThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Commander</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    El formato más popular de Magic. Encuentra guías, tech de mazos, gameplays y todo lo necesario para mejorar tu experiencia en Commander y cEDH.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            ) : (
                <>
                    {/* Articles Section */}
                    <section>
                        <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-8 border-b border-slate-700 pb-2">Artículos y Guías</h2>
                        {articles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {articles.map(article => (
                                    <Card
                                        key={article.id}
                                        imageUrl={article.image_url || 'https://images.unsplash.com/photo-1621532297839-84725d259508?auto=format&fit=crop&q=80&w=800'} // Fallback Magic-themed image
                                        title={article.title}
                                    >
                                        <p className="text-slate-400 mb-4 line-clamp-3">{article.excerpt}</p>
                                        <div className="flex items-center justify-between text-sm text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4" />
                                                <span>Por: {article.author || 'Admin'}</span>
                                            </div>
                                            <span className="inline-block bg-slate-800 rounded px-2 py-0.5 text-xs border border-slate-700 capitalize">
                                                {article.category || 'Artículo'}
                                            </span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                                <p className="text-slate-400">Pronto tendremos artículos disponibles.</p>
                            </div>
                        )}
                    </section>

                    {/* Videos Section */}
                    <section>
                        <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-8 border-b border-slate-700 pb-2">Videos y Gameplays</h2>
                        {videos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {videos.map(video => (
                                    <a key={video.id} href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer" className="block group">
                                        <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-slate-700 h-full flex flex-col">
                                            <div className="relative">
                                                <img
                                                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                                    src={video.thumbnailUrl || getYoutubeThumbnail(video.youtubeId)}
                                                    alt={video.title}
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <PlayIcon className="w-16 h-16 text-white/80" />
                                                </div>
                                            </div>
                                            <div className="p-6 flex-grow flex flex-col">
                                                <h3 className="font-bold text-lg mb-2 text-white uppercase group-hover:text-sky-400 transition-colors line-clamp-2">{video.title}</h3>
                                                <div className="flex items-center justify-between text-sm text-slate-400 mt-auto">
                                                    <div className="flex items-center gap-2">
                                                        <PlayIcon className="w-4 h-4 text-slate-500" />
                                                        <span>{video.channel || 'Canal'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                                <p className="text-slate-400">Pronto tendremos videos disponibles.</p>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};

export default CommanderPage;
