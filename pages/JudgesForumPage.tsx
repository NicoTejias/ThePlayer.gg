import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import JudgeBadge from '../components/JudgeBadge';

// Types
interface Thread {
    id: string;
    title: string;
    category: 'rulings' | 'policy' | 'tournament_ops' | 'off_topic' | 'announcements';
    is_pinned: boolean;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
    author: {
        username: string;
        judge_level?: string;
    };
    _count?: {
        posts: number;
    };
}

interface Post {
    id: string;
    content: string;
    created_at: string;
    author: {
        username: string;
        judge_level?: string;
    };
}

const CATEGORIES = [
    { id: 'all', label: 'Todos los temas', icon: '🔍' },
    { id: 'announcements', label: 'Anuncios Oficiales', icon: '📢' },
    { id: 'rulings', label: 'Reglas y Rulings', icon: '⚖️' },
    { id: 'policy', label: 'Políticas de Torneo', icon: '📜' },
    { id: 'tournament_ops', label: 'Operaciones', icon: '🛠️' },
    { id: 'off_topic', label: 'Off-Topic', icon: '☕' },
];

const JudgesForumPage: React.FC = () => {
    // View State
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail'>('list');
    const [activeCategory, setActiveCategory] = useState('all');

    // Data State
    const [threads, setThreads] = useState<Thread[]>([]);
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);

    // Loading State
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Form State
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [newThreadCategory, setNewThreadCategory] = useState('rulings');
    const [newReplyContent, setNewReplyContent] = useState('');

    useEffect(() => {
        fetchThreads();
    }, [activeCategory]);

    const fetchThreads = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('judge_forum_threads')
                .select(`
                    *,
                    author:profiles(username),
                    posts:judge_forum_posts(count)
                `)
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (activeCategory !== 'all') {
                query = query.eq('category', activeCategory);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Transform data to match interface (handling count safely)
            const formattedThreads = data?.map(t => ({
                ...t,
                _count: { posts: t.posts ? t.posts[0]?.count || 0 : 0 } // Adjust based on actual response structure for count
            })) || [];

            setThreads(formattedThreads);
        } catch (error) {
            console.error('Error fetching threads:', error);
            // toast.error('Error al cargar discusiones'); // Suppress to avoid spam on initial load if RLS fails silently
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async (threadId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('judge_forum_posts')
                .select(`
                    *,
                    author:profiles(username)
                `)
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
            toast.error('Error al cargar respuestas');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateThread = async () => {
        if (!newThreadTitle.trim() || !newThreadContent.trim()) {
            toast.error('Título y contenido son obligatorios');
            return;
        }

        setProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No estás autenticado');

            // 1. Create Thread
            const { data: thread, error: threadError } = await supabase
                .from('judge_forum_threads')
                .insert({
                    title: newThreadTitle,
                    category: newThreadCategory,
                    author_id: user.id
                })
                .select()
                .single();

            if (threadError) throw threadError;

            // 2. Create First Post (OP)
            const { error: postError } = await supabase
                .from('judge_forum_posts')
                .insert({
                    thread_id: thread.id,
                    author_id: user.id,
                    content: newThreadContent
                });

            if (postError) throw postError;

            toast.success('Discusión creada correctamente');
            setViewMode('list');
            setNewThreadTitle('');
            setNewThreadContent('');
            fetchThreads();
        } catch (error: any) {
            console.error('Error creating thread:', error);
            toast.error(error.message || 'Error al crear discusión');
        } finally {
            setProcessing(false);
        }
    };

    const handleReply = async () => {
        if (!newReplyContent.trim() || !selectedThread) return;

        setProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No estás autenticado');

            const { error } = await supabase
                .from('judge_forum_posts')
                .insert({
                    thread_id: selectedThread.id,
                    author_id: user.id,
                    content: newReplyContent
                });

            if (error) throw error;

            // Update thread updated_at
            await supabase
                .from('judge_forum_threads')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', selectedThread.id);

            setNewReplyContent('');
            fetchPosts(selectedThread.id);
            toast.success('Respuesta enviada');
        } catch (error) {
            console.error('Error replying:', error);
            toast.error('Error al enviar respuesta');
        } finally {
            setProcessing(false);
        }
    };

    const openThread = (thread: Thread) => {
        setSelectedThread(thread);
        setViewMode('detail');
        fetchPosts(thread.id);
    };

    const getCategoryBadge = (category: string) => {
        const styles: Record<string, string> = {
            announcements: 'bg-red-500/20 text-red-300 border-red-500/30',
            rulings: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            policy: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            tournament_ops: 'bg-green-500/20 text-green-300 border-green-500/30',
            off_topic: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
        };
        const cat = CATEGORIES.find(c => c.id === category);
        return (
            <span className={`px-2 py-0.5 rounded text-xs border ${styles[category] || styles.off_topic} flex items-center gap-1`}>
                <span>{cat?.icon}</span>
                <span className="capitalize">{cat?.label}</span>
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Sidebar Navigation */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <button
                            onClick={() => {
                                setViewMode('create');
                                setSelectedThread(null);
                            }}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                        >
                            <span>✍️</span> Nueva Discusión
                        </button>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                        <h3 className="text-xs font-bold text-slate-500 uppercase p-4 pb-2">Categorías</h3>
                        <div className="flex flex-col">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setActiveCategory(cat.id);
                                        setViewMode('list');
                                    }}
                                    className={`px-4 py-3 text-left hover:bg-slate-800 transition-colors flex items-center gap-3 ${activeCategory === cat.id ? 'bg-slate-800 text-amber-400 border-l-2 border-amber-400' : 'text-slate-400'
                                        }`}
                                >
                                    <span className="text-lg opacity-80">{cat.icon}</span>
                                    <span className="text-sm font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-3">

                    {/* THREAD LIST VIEW */}
                    {viewMode === 'list' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                                <span>{CATEGORIES.find(c => c.id === activeCategory)?.icon}</span>
                                {CATEGORIES.find(c => c.id === activeCategory)?.label}
                            </h2>

                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-slate-500 text-sm">Cargando discusiones...</p>
                                </div>
                            ) : threads.length > 0 ? (
                                threads.map(thread => (
                                    <div
                                        key={thread.id}
                                        onClick={() => openThread(thread)}
                                        className={`bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-amber-500/30 transition-all cursor-pointer group ${thread.is_pinned ? 'border-l-4 border-l-amber-500 bg-amber-900/5' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {thread.is_pinned && <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">📌 Fijado</span>}
                                                    {getCategoryBadge(thread.category)}
                                                    <span className="text-slate-500 text-xs">• {new Date(thread.updated_at).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                                                    {thread.title}
                                                </h3>
                                                <p className="text-sm text-slate-400 mt-1">
                                                    Iniciado por <span className="text-slate-300">{thread.author?.username}</span>
                                                </p>
                                            </div>

                                            <div className="text-center min-w-[60px] hidden md:block">
                                                <div className="text-xl font-bold text-slate-300">{/* thread._count?.posts || 0 */} 💬</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                                    <span className="text-4xl block mb-4">🦗</span>
                                    <h3 className="text-lg font-bold text-white mb-2">No hay discusiones aquí</h3>
                                    <p className="text-slate-400 mb-6">Sé el primero en iniciar un tema en esta categoría.</p>
                                    <button
                                        onClick={() => setViewMode('create')}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                                    >
                                        Crear Discusión
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CREATE THREAD VIEW */}
                    {viewMode === 'create' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <button
                                onClick={() => setViewMode('list')}
                                className="mb-4 text-sm text-slate-400 hover:text-white flex items-center gap-1"
                            >
                                ← Volver al foro
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-6">Crear Nueva Discusión</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Título</label>
                                    <input
                                        type="text"
                                        value={newThreadTitle}
                                        onChange={(e) => setNewThreadTitle(e.target.value)}
                                        placeholder="Escribe un título descriptivo..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Categoría</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setNewThreadCategory(cat.id)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${newThreadCategory === cat.id
                                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                {cat.icon} {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Contenido</label>
                                    <textarea
                                        value={newThreadContent}
                                        onChange={(e) => setNewThreadContent(e.target.value)}
                                        placeholder="Comparte tus dudas, ideas o situaciones..."
                                        rows={8}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Recuerda mantener el respeto y las normas de conducta del programa de jueces.
                                    </p>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleCreateThread}
                                        disabled={processing}
                                        className="px-8 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50"
                                    >
                                        {processing ? 'Publicando...' : 'Publicar Discusión'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* THREAD DETAIL VIEW */}
                    {viewMode === 'detail' && selectedThread && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setViewMode('list')}
                                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                            >
                                ← Volver a {CATEGORIES.find(c => c.id === selectedThread.category)?.label}
                            </button>

                            {/* Thread Header */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    {getCategoryBadge(selectedThread.category)}
                                    <span className="text-slate-500 text-sm">{new Date(selectedThread.created_at).toLocaleString()}</span>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-6 leading-tight">{selectedThread.title}</h1>

                                {/* Pinned/Locked Status */}
                                {(selectedThread.is_pinned || selectedThread.is_locked) && (
                                    <div className="flex gap-2 mb-6">
                                        {selectedThread.is_pinned && <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-xs border border-amber-500/30">📌 Fijado</span>}
                                        {selectedThread.is_locked && <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs border border-red-500/30">🔒 Cerrado</span>}
                                    </div>
                                )}

                                {/* Posts List (First post is implicitly the thread content if data model supports it, but here we fetch all posts) */}
                                {loading ? (
                                    <div className="py-12 flex justify-center">
                                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {posts.map((post, index) => (
                                            <div key={post.id} className={`flex gap-4 ${index === 0 ? 'pb-6 border-b border-slate-800' : ''}`}>
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg border border-slate-700">
                                                        {post.author?.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-baseline justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-white">{post.author?.username}</span>
                                                            <JudgeBadge level={post.author?.judge_level || 'L0'} size="small" />
                                                            {index === 0 && <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">OP</span>}
                                                        </div>
                                                        <span className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                        {post.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Reply Box */}
                            {!selectedThread.is_locked && (
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Tu Respuesta</h3>
                                    <div className="space-y-4">
                                        <textarea
                                            value={newReplyContent}
                                            onChange={(e) => setNewReplyContent(e.target.value)}
                                            placeholder="Escribe tu respuesta aquí. Sé amable y constructivo."
                                            rows={4}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleReply}
                                                disabled={processing || !newReplyContent.trim()}
                                                className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processing ? 'Enviando...' : 'Responder'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default JudgesForumPage;
