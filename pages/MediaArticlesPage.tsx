import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    image_url?: string;
    category: string;
    created_at: string;
}

const MediaArticlesPage: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (!error) {
                setArticles(data || []);
            }
            setLoading(false);
        };

        fetchArticles();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in-up">
            <div className="flex flex-col items-center justify-center text-center space-y-6 mb-12">
                <div className="bg-blue-900/20 p-6 rounded-full border border-blue-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-blue-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                    </svg>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    Artículos y Noticias
                </h1>
                <p className="text-xl text-slate-400 max-w-lg">
                    Reportes de torneos, guías estratégicas y opinión.
                </p>
                <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
            </div>

            {articles.length === 0 ? (
                <div className="text-center text-slate-500 py-12 border border-slate-700 rounded-lg bg-slate-800/50">
                    <p className="text-xl">Aún no hay artículos publicados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map(article => (
                        <Link to={`/media/articulos/${article.slug}`} key={article.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl hover:shadow-2xl transition-all hover:border-blue-500/50 group flex flex-col h-full">
                            {article.image_url ? (
                                <div className="h-48 overflow-hidden">
                                    <img src={article.image_url} alt={article.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            ) : (
                                <div className="h-48 bg-slate-700 flex items-center justify-center">
                                    <span className="text-4xl">📰</span>
                                </div>
                            )}

                            <div className="p-6 flex-1 flex flex-col">
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                                    {article.category}
                                </span>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                    {article.title}
                                </h3>
                                {(article.excerpt) && (
                                    <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">
                                        {article.excerpt}
                                    </p>
                                )}
                                <div className="text-xs text-slate-500 mt-auto pt-4 border-t border-slate-700 flex justify-between">
                                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                                    <span className="text-blue-400 font-bold group-hover:translate-x-1 transition-transform">Leer más →</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaArticlesPage;
