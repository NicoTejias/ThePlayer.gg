import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ForumThread, ForumPost } from '../../types';
import { MessageSquare, Calendar, User, ChevronRight, Share2, Flag, Reply } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ThreadData extends ForumThread {
    author: {
        username: string;
        avatar_url: string | null;
        role?: string;
    } | null;
}

interface PostData extends ForumPost {
    author: {
        username: string;
        avatar_url: string | null;
        role?: string;
    } | null;
}

const ForumThreadPage: React.FC = () => {
    const { categorySlug, boardSlug, threadSlug } = useParams<{ categorySlug: string; boardSlug: string; threadSlug: string }>();
    const [thread, setThread] = useState<ThreadData | null>(null);
    const [posts, setPosts] = useState<PostData[]>([]);
    const [newItemContent, setNewItemContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        checkUser();
    }, []);

    useEffect(() => {
        if (threadSlug) {
            fetchThreadAndPosts();
        }
    }, [threadSlug]);

    const checkUser = async () => {
        const { data } = await supabase.auth.getUser();
        setCurrentUser(data.user);
    };

    const fetchThreadAndPosts = async () => {
        try {
            setLoading(true);

            // 1. Fetch Thread
            const { data: threadData, error: threadError } = await supabase
                .from('forum_threads')
                .select(`
                    *,
                    author:profiles!author_profile_id(username, avatar_url, role)
                `)
                .eq('slug', threadSlug)
                .single();

            if (threadError) throw threadError;

            setThread(threadData);

            // Increment View Count (Fire and forget)
            const incrementView = async () => {
                const { error } = await supabase.rpc('increment_thread_view', { t_id: threadData.id });
                if (error) {
                    await supabase.from('forum_threads').update({ view_count: threadData.view_count + 1 }).eq('id', threadData.id);
                }
            };
            incrementView();

            // 2. Fetch Posts
            const { data: postsData, error: postsError } = await supabase
                .from('forum_posts')
                .select(`
                    *,
                    author:profiles!author_profile_id(username, avatar_url, role)
                `)
                .eq('thread_id', threadData.id)
                .order('created_at', { ascending: true });

            if (postsError) throw postsError;

            setPosts(postsData || []);

        } catch (error) {
            console.error('Error fetching thread:', error);
            toast.error("No se pudo cargar el tema");
        } finally {
            setLoading(false);
        }
    };

    const handlePostReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemContent.trim() || !currentUser || !thread) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('forum_posts')
                .insert({
                    thread_id: thread.id,
                    user_id: currentUser.id,
                    author_profile_id: currentUser.id, // Keep linked
                    content: newItemContent,
                    author_name: 'Usuario' // Fallback
                });

            if (error) throw error;

            setNewItemContent('');
            toast.success('Respuesta publicada');
            fetchThreadAndPosts(); // Refresh
        } catch (error: any) {
            console.error('Error posting reply:', error);
            toast.error('Error al publicar: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!thread) {
        return <div className="p-12 text-center text-slate-400">Tema no encontrado</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-400 mb-6 gap-2 flex-wrap">
                <Link to="/foro" className="hover:text-white transition-colors">Foro</Link>
                <ChevronRight className="w-4 h-4" />
                <Link to={`/foro/${categorySlug}/${boardSlug}`} className="hover:text-white transition-colors">Sub-foro</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white font-semibold line-clamp-1">{thread.title}</span>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{thread.title}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
                        {thread.pinned && '📌 Fijado'} {thread.locked && '🔒 Cerrado'}
                    </span>
                    <span>Vistas: {thread.view_count}</span>
                    <span>Publicado: {format(new Date(thread.created_at), "d MMMM yyyy", { locale: es })}</span>
                </div>
            </div>

            <div className="space-y-6">
                {/* OP Post */}
                <div className="bg-slate-800/80 rounded-xl border border-slate-700/50 overflow-hidden shadow-lg relative">
                    <div className="flex flex-col md:flex-row">
                        {/* Author Sidebar */}
                        <div className="bg-slate-900/50 p-6 md:w-64 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-700/50 shrink-0">
                            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 mb-4 overflow-hidden">
                                {thread.author?.avatar_url ? (
                                    <img src={thread.author.avatar_url} alt={thread.author.username} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full p-4 text-slate-600" />
                                )}
                            </div>
                            <span className="font-bold text-lg text-white mb-1">{thread.author?.username || 'Anónimo'}</span>
                            <span className="text-xs text-sky-400 uppercase font-bold bg-sky-900/20 px-2 py-0.5 rounded">
                                {thread.author?.role === 'admin' ? 'Administrador' : thread.author?.role === 'store' ? 'Tienda' : 'Jugador'}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-grow">
                            <div className="prose prose-invert max-w-none mb-8 whitespace-pre-wrap">
                                {thread.content}
                            </div>

                            <div className="flex justify-end gap-2 text-sm text-slate-500 pt-4 border-t border-slate-700/30">
                                <button className="flex items-center gap-1 hover:text-white transition-colors">
                                    <Share2 className="w-4 h-4" /> Compartir
                                </button>
                                <button className="flex items-center gap-1 hover:text-red-400 transition-colors ml-4">
                                    <Flag className="w-4 h-4" /> Reportar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Replies */}
                {posts.map((post) => (
                    <div key={post.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden shadow-lg">
                        <div className="flex flex-col md:flex-row">
                            <div className="bg-slate-900/30 p-6 md:w-64 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-700/50 shrink-0">
                                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 mb-3 overflow-hidden">
                                    {post.author?.avatar_url ? (
                                        <img src={post.author.avatar_url} alt={post.author.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-full h-full p-4 text-slate-600" />
                                    )}
                                </div>
                                <span className="font-bold text-slate-200 mb-1">{post.author?.username || 'Anónimo'}</span>
                                <span className="text-[10px] text-slate-500 uppercase">{post.author?.role || 'Miembro'}</span>
                            </div>

                            <div className="p-6 flex-grow">
                                <div className="flex justify-between text-xs text-slate-500 mb-4">
                                    <span>{format(new Date(post.created_at), "d MMMM yyyy HH:mm", { locale: es })}</span>
                                    <span>#{post.id.slice(0, 4)}</span>
                                </div>
                                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-slate-300">
                                    {post.content}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Reply Form */}
                {currentUser ? (
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mt-8">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Reply className="w-5 h-5 text-sky-500" />
                            Publicar Respuesta
                        </h3>
                        {thread.locked ? (
                            <div className="bg-red-500/10 text-red-200 p-4 rounded border border-red-500/20">
                                Este tema está cerrado. No se admiten nuevas respuestas.
                            </div>
                        ) : (
                            <form onSubmit={handlePostReply}>
                                <textarea
                                    value={newItemContent}
                                    onChange={(e) => setNewItemContent(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent min-h-[150px]"
                                    placeholder="Escribe tu respuesta aquí..."
                                    required
                                />
                                <div className="flex justify-end mt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting || !newItemContent.trim()}
                                        className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Publicando...' : 'Responder'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50 mt-8">
                        <p className="text-slate-400 mb-4">Debes iniciar sesión para participar en la discusión.</p>
                        <Link to="/login" className="text-sky-400 hover:scale-105 inline-block font-bold">
                            Iniciar Sesión
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForumThreadPage;
