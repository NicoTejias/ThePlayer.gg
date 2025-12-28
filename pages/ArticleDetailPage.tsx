import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ReactMarkdown from 'react-markdown';

interface Article {
    id: string;
    title: string;
    slug: string;
    content: string;
    image_url?: string;
    game_type: string;
    category: string;
    created_at: string;
    author: {
        username: string;
    };
}

const ArticleDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArticle = async () => {
            if (!slug) return;

            const { data, error } = await supabase
                .from('articles')
                .select(`
                    *,
                    author:profiles(username)
                `)
                .eq('slug', slug)
                .single();

            if (error) {
                console.error("Error fetching article:", error);
                navigate('/media/articulos'); // Redirect if not found
            } else {
                setArticle(data);
            }
            setLoading(false);
        };

        fetchArticle();
    }, [slug, navigate]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!article) return null;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 animate-fade-in">
            {/* Hero Image */}
            {article.image_url && (
                <div className="w-full h-64 md:h-96 relative">
                    <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                        {article.category}
                    </span>
                    <span className="text-slate-400 text-sm border-l border-slate-600 pl-3 uppercase tracking-wider">
                        {article.game_type}
                    </span>
                    <span className="text-slate-400 text-sm">
                        {new Date(article.created_at).toLocaleDateString()}
                    </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    {article.title}
                </h1>

                {/* Author */}
                <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-6">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
                        👤
                    </div>
                    <div>
                        <p className="font-bold text-white">{article.author?.username || 'Redacción'}</p>
                        <p className="text-xs text-slate-400">Autor</p>
                    </div>
                </div>

                {/* Content */}
                <article className="prose prose-invert prose-lg max-w-none">
                    <ReactMarkdown>
                        {article.content}
                    </ReactMarkdown>
                </article>
            </div>
        </div>
    );
};

export default ArticleDetailPage;
