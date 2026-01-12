import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ContentCard from '../components/ContentCard';
import { toast } from 'sonner';

interface ContentItem {
    id: string;
    title: string;
    description: string | null; // For excerpt or description
    image_url?: string | null; // Standardized image key
    type: 'article' | 'video';
    creator_name?: string; // We might need to join profiles
    created_at: string;
    external_url?: string; // For videos via youtube_id
}

const ContentPage: React.FC = () => {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            setLoading(true);

            // Fetch articles
            const { data: articles, error: articlesError } = await supabase
                .from('articles')
                .select(`
                    id, 
                    title, 
                    excerpt, 
                    image_url, 
                    created_at, 
                    profiles:author_id (username)
                `)
                .eq('is_published', true)
                .order('created_at', { ascending: false })
                .limit(20);

            if (articlesError) throw articlesError;

            // Fetch videos
            const { data: videos, error: videosError } = await supabase
                .from('videos')
                .select(`
                    id, 
                    title, 
                    description, 
                    youtube_id, 
                    created_at, 
                    profiles:creator_id (username)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (videosError) throw videosError;

            // Normalize and combine data
            const normalizedArticles: ContentItem[] = (articles || []).map((a: any) => ({
                id: a.id,
                title: a.title,
                description: a.excerpt,
                image_url: a.image_url,
                type: 'article',
                creator_name: a.profiles?.username || 'Redacción',
                created_at: a.created_at
            }));

            const normalizedVideos: ContentItem[] = (videos || []).map((v: any) => ({
                id: v.id,
                title: v.title,
                description: v.description,
                image_url: v.youtube_id ? `https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg` : null,
                type: 'video',
                creator_name: v.profiles?.username || 'Creador',
                created_at: v.created_at,
                external_url: v.youtube_id ? `https://www.youtube.com/watch?v=${v.youtube_id}` : undefined
            }));

            const combinedContent = [...normalizedArticles, ...normalizedVideos].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setContent(combinedContent);
        } catch (error) {
            console.error('Error fetching content:', error);
            toast.error('Error al cargar el contenido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-12 animate-fade-in">
            <div className="container mx-auto px-4">
                {/* Hero Section */}
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/30 blur-[100px] rounded-full pointer-events-none -z-10"></div>

                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-purple-500 to-pink-500 mb-6 drop-shadow-2xl tracking-tighter">
                        HUB DE CONTENIDO
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
                        Noticias, Artículos, Estrategias y Videos. <br />
                        <span className="text-sky-400 font-bold">Todo el contenido de la comunidad en un solo lugar.</span>
                    </p>

                    <div className="flex justify-center gap-4">
                        <Link
                            to="/creadores"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white font-bold text-lg shadow-lg shadow-orange-900/40 transition-all hover:scale-105"
                        >
                            <span>🚀 Convertirme en Creador</span>
                        </Link>
                    </div>
                </div>

                {/* Filters / Tabs (Future Implementation) */}
                {/* For now, just a unified grid */}

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <div key={n} className="bg-slate-800 rounded-xl aspect-[4/3] animate-pulse"></div>
                        ))}
                    </div>
                ) : content.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Aún no hay contenido disponible</h3>
                        <p className="text-slate-400">Sé el primero en publicar algo increíble.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {content.map((item) => (
                            <ContentCard
                                key={`${item.type}-${item.id}`}
                                id={item.id}
                                title={item.title}
                                description={item.description}
                                imageUrl={item.image_url}
                                type={item.type}
                                creatorName={item.creator_name}
                                date={item.created_at}
                                externalUrl={item.external_url}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentPage;
