import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ForumBoard, ForumThread, ForumCategory } from '../../types';
import { MessageSquare, Calendar, User, Eye, Lock, Pin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BoardData extends ForumBoard {
    category: ForumCategory;
}

interface ThreadWithStats extends ForumThread {
    reply_count: number;
    author: {
        username: string;
        avatar_url: string | null;
    } | null;
}

const ForumBoardPage: React.FC = () => {
    const { categorySlug, boardSlug } = useParams<{ categorySlug: string; boardSlug: string }>();
    const [board, setBoard] = useState<BoardData | null>(null);
    const [threads, setThreads] = useState<ThreadWithStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (categorySlug && boardSlug) {
            fetchBoardAndThreads();
        }
    }, [categorySlug, boardSlug]);

    const fetchBoardAndThreads = async () => {
        try {
            setLoading(true);

            // 1. Fetch Board & Category info
            const { data: categories, error: catError } = await supabase
                .from('forum_categories')
                .select('id, name, slug')
                .eq('slug', categorySlug)
                .single();

            if (catError) throw catError;

            const { data: boards, error: boardError } = await supabase
                .from('forum_boards')
                .select('*')
                .eq('slug', boardSlug)
                .eq('category_id', categories.id)
                .single();

            if (boardError) throw boardError;

            setBoard({ ...boards, category: categories });

            // 2. Fetch Threads
            // We join with profiles for author info and select count of posts (minus 1 for OP technically, but here all are posts)
            // Ideally we separate OP from replies, but current schema places everything in one bucket or maybe OP is just the thread row + first post?
            // Schema: thread has 'content' (OP). 'posts' are replies. So count of posts is exactly reply count.
            const { data: threadsData, error: threadsError } = await supabase
                .from('forum_threads')
                .select(`
                    *,
                    author:profiles!author_profile_id(username, avatar_url),
                    forum_posts(count)
                `)
                .eq('board_id', boards.id)
                .order('pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (threadsError) {
                console.error("Threads fetch error:", threadsError);
                // Fallback if profiles not linked properly or other error
                setThreads([]);
            } else {
                const formattedThreads = threadsData.map((t: any) => ({
                    ...t,
                    reply_count: t.forum_posts?.[0]?.count || 0,
                    author: t.author || { username: 'Usuario' }
                }));
                setThreads(formattedThreads);
            }
        } catch (error) {
            console.error('Error fetching board:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!board) {
        return (
            <div className="text-center p-12 text-slate-400">
                <h2 className="text-xl font-bold mb-2">Foro no encontrado</h2>
                <Link to="/foro" className="text-sky-400 hover:underline">Volver al índice</Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-slate-400 mb-6 gap-2">
                <Link to="/foro" className="hover:text-white transition-colors">Foro</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-slate-300">{board.category.name}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white font-semibold">{board.name}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{board.name}</h1>
                    <p className="text-slate-400">{board.description}</p>
                </div>
                <Link
                    to={`/foro/${categorySlug}/${boardSlug}/nuevo`}
                    className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-sky-900/20"
                >
                    <MessageSquare className="w-5 h-5" />
                    Nuevo Tema
                </Link>
            </div>

            {/* Thread List */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden shadow-lg">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900/50 border-b border-slate-700/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-7">Tema</div>
                    <div className="col-span-2 text-center">Estadísticas</div>
                    <div className="col-span-3 text-right">Última Actividad</div>
                </div>

                <div className="divide-y divide-slate-700/50">
                    {threads.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-300 mb-1">Este foro está vacío</h3>
                            <p className="text-slate-500 mb-6">Sé el primero en iniciar una conversación.</p>
                            <Link
                                to={`/foro/${categorySlug}/${boardSlug}/nuevo`}
                                className="text-sky-400 hover:text-sky-300 font-medium hover:underline"
                            >
                                Crear nuevo tema
                            </Link>
                        </div>
                    ) : (
                        threads.map((thread) => (
                            <div key={thread.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 hover:bg-slate-700/30 transition-colors group">
                                <div className="col-span-1 md:col-span-7">
                                    <div className="flex items-start gap-4">
                                        <div className="pt-1">
                                            {thread.pinned ? (
                                                <Pin className="w-5 h-5 text-amber-500" />
                                            ) : thread.locked ? (
                                                <Lock className="w-5 h-5 text-red-400" />
                                            ) : (
                                                <MessageSquare className="w-5 h-5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                                            )}
                                        </div>
                                        <div>
                                            <Link
                                                to={`/foro/${categorySlug}/${boardSlug}/${thread.slug}`}
                                                className="text-lg font-bold text-slate-200 group-hover:text-sky-400 transition-colors line-clamp-1 block mb-1"
                                            >
                                                {thread.title}
                                            </Link>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {thread.author?.username || 'Anónimo'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(thread.created_at), "d MMM yyyy", { locale: es })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-center gap-6 text-sm text-slate-400">
                                    <div className="flex items-center gap-2" title="Respuestas">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>{thread.reply_count}</span>
                                    </div>
                                    <div className="flex items-center gap-2" title="Vistas">
                                        <Eye className="w-4 h-4" />
                                        <span>{thread.view_count}</span>
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-3 flex items-center justify-end text-right text-xs text-slate-500">
                                    <div>
                                        <p className="text-slate-400">{format(new Date(thread.updated_at), "d MMM HH:mm", { locale: es })}</p>
                                        <p>Última actualización</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForumBoardPage;
