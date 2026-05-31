import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ChevronRight, MessageSquare, Save } from 'lucide-react';
import { toast } from 'sonner';

const CreateThreadPage: React.FC = () => {
    const { categorySlug, boardSlug } = useParams<{ categorySlug: string; boardSlug: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [boardId, setBoardId] = useState<string | null>(null);
    const [boardName, setBoardName] = useState('');

    useEffect(() => {
        if (boardSlug) {
            fetchBoardInfo();
        }
    }, [boardSlug]);

    const fetchBoardInfo = async () => {
        const { data, error } = await supabase
            .from('forum_boards')
            .select('id, name, category_id')
            .eq('slug', boardSlug) // Assuming unique slug in global scope or I should filter by category too technically
            .single();

        if (data) {
            setBoardId(data.id);
            setBoardName(data.name);
        } else {
            toast.error('Foro no encontrado');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !boardId) return;

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Debes iniciar sesión");

            // Generate Slug
            const rawSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const uniqueSuffix = Date.now().toString().slice(-4);
            const slug = `${rawSlug}-${uniqueSuffix}`;

            const { data, error } = await supabase
                .from('forum_threads')
                .insert({
                    board_id: boardId,
                    user_id: user.id,
                    title: title.trim(),
                    slug: slug,
                    content: content,
                    author_name: 'Usuario' // Placeholder, triggers or cross-join handle display
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('Tema creado con éxito');
            navigate(`/foro/${categorySlug}/${boardSlug}/${slug}`);

        } catch (error: any) {
            console.error('Error creating thread:', error);
            toast.error('Error al crear tema: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center text-sm text-slate-400 mb-6 gap-2">
                <Link to="/foro" className="hover:text-white transition-colors">Foro</Link>
                <ChevronRight className="w-4 h-4" />
                <Link to={`/foro/${categorySlug}/${boardSlug}`} className="hover:text-white transition-colors">{boardName || 'Sub-foro'}</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white font-semibold">Nuevo Tema</span>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-xl">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-sky-500" />
                    Crear Nuevo Tema
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Título del Tema</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            placeholder="Escribe un título descriptivo..."
                            maxLength={100}
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1 text-right">{title.length}/100</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Contenido</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent min-h-[300px]"
                            placeholder="Comparte tus ideas, preguntas o estrategias..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <Link
                            to={`/foro/${categorySlug}/${boardSlug}`}
                            className="px-6 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-sky-900/20 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {submitting ? 'Publicando...' : 'Publicar Tema'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateThreadPage;
