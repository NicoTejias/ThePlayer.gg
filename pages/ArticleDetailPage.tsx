import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Article {
    id: string;
    title: string;
    slug: string;
    content: string;
    image_url?: string;
    game_type: string;
    category: string;
    created_at: string;
    is_premium?: boolean;
    author: {
        username: string;
    };
}

const ArticleDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArticleAndCheckAccess = async () => {
            if (!slug) return;

            // 1. Fetch Article
            const { data: articleData, error } = await supabase
                .from('articles')
                .select(`
                    *,
                    author:profiles(username)
                `)
                .eq('slug', slug)
                .single();

            if (error || !articleData) {
                console.error("Error fetching article:", error);
                navigate('/media/articulos');
                return;
            }

            setArticle(articleData);

            // 2. Check Access
            if (!articleData.is_premium) {
                setHasAccess(true);
                setCheckingAccess(false);
                return;
            }

            // Check User Permissions
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setHasAccess(false);
                setCheckingAccess(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, subscription_tier')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                // Allow admins, the author (although we didn't check author_id here, assuming admins cover moderation), 
                // and subscribers
                const isSubscriber = profile.subscription_tier === 'premium' || profile.subscription_tier === 'vip'; // Adjust tier names as needed
                const isAdmin = profile.role === 'admin';
                const isStores = profile.role === 'store'; // Stores typically spend money, maybe give access? Let's say yes for now.

                if (isSubscriber || isAdmin || isStores) {
                    setHasAccess(true);

                    // 3. Log View (Only if accessing premium content)
                    // We fire and forget this request
                    supabase.from('content_views').insert({
                        user_id: session.user.id,
                        content_id: articleData.id,
                        content_type: 'article',
                        creator_id: articleData.author_id // Requires articleData to have author_id, usually matches selected '*'
                    }).then(({ error }) => {
                        if (error) console.error("Error logging view:", error);
                    });

                } else {
                    setHasAccess(false);
                }
            } else {
                setHasAccess(false);
            }
            setCheckingAccess(false);
        };

        fetchArticleAndCheckAccess();
    }, [slug, navigate]);

    if (loading && !article) return (
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
                        className={`w-full h-full object-cover ${!hasAccess && checkingAccess === false ? 'blur-sm brightness-50' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                    {article.is_premium && (
                        <div className="absolute top-4 right-4 bg-yellow-500/90 text-black font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg backdrop-blur-sm">
                            <span>👑</span> Premium
                        </div>
                    )}
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
                {checkingAccess ? (
                    <div className="py-20 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : hasAccess ? (
                    <article className="prose prose-invert prose-lg max-w-none">
                        <ReactMarkdown>
                            {article.content}
                        </ReactMarkdown>
                    </article>
                ) : (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center space-y-6 backdrop-blur-sm relative overflow-hidden">
                        {/* Fake blurred content background */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none select-none overflow-hidden blur-[2px]" aria-hidden="true">
                            <p>Este es un artículo exclusivo que requiere una cuenta activa. Para leer el contenido completo y profundizar en las estrategias de juego, por favor ingresa con tu cuenta o suscríbete a nuestros planes premium.</p>
                            <p>Sumérgete en el mundo competitivo de los TCG con análisis detallados realizados por expertos jugadores y para los fanáticos más dedicados del circuito regional.</p>
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 text-3xl ring-1 ring-yellow-500/50">
                                👑
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Contenido Exclusivo para Suscriptores</h2>
                            <p className="text-slate-400 max-w-md mx-auto mb-6">
                                Este artículo está reservado para miembros de la comunidad con suscripción activa. Apoya a los creadores y accede a contenido premium.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/auth" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">
                                    Iniciar Sesión
                                </Link>
                                <Link to="/suscribirse" className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold rounded-lg transition-all shadow-lg shadow-yellow-500/20">
                                    Obtener Suscripción
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArticleDetailPage;
