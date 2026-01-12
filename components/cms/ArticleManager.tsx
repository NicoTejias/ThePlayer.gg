import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';

interface Article {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    image_url?: string;
    game_type: string;
    category: string;
    is_published: boolean;
    published_at?: string;
    created_at: string;
    is_premium?: boolean;
}

interface ArticleManagerProps {
    authorId?: string;
}

const ArticleManager: React.FC<ArticleManagerProps> = ({ authorId }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        imageUrl: '',
        gameType: 'general',
        category: 'news',
        isPublished: false,
        isPremium: false
    });

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        setLoading(true);
        let query = supabase
            .from('articles')
            .select('*');

        if (authorId) {
            query = query.eq('author_id', authorId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            toast.error('Error al cargar artículos');
            console.error(error);
        } else {
            setArticles(data || []);
        }
        setLoading(false);
    };

    const handleCreateNew = () => {
        setFormData({
            title: '',
            slug: '',
            content: '',
            excerpt: '',
            imageUrl: '',
            gameType: 'general',
            category: 'news',
            isPublished: false,
            isPremium: false
        });
        setEditingId(null);
        setShowForm(true);
    };

    const handleEdit = (article: Article) => {
        setFormData({
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt || '',
            imageUrl: article.image_url || '',
            gameType: article.game_type,
            category: article.category || 'news',
            isPublished: article.is_published,
            isPremium: article.is_premium || false
        });
        setEditingId(article.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este artículo?')) return;

        const { error } = await supabase.from('articles').delete().eq('id', id);
        if (error) {
            toast.error('Error al eliminar');
        } else {
            toast.success('Artículo eliminado');
            fetchArticles();
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            slug: !editingId ? generateSlug(title) : prev.slug // Auto-generate slug only on create
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No usuario');

            const payload = {
                title: formData.title,
                slug: formData.slug,
                content: formData.content,
                excerpt: formData.excerpt,
                image_url: formData.imageUrl,
                game_type: formData.gameType,
                category: formData.category,
                is_published: formData.isPublished,
                is_premium: formData.isPremium,
                author_id: user.id,
                published_at: formData.isPublished ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            };

            let error;
            if (editingId) {
                const { error: updateError } = await supabase
                    .from('articles')
                    .update(payload)
                    .eq('id', editingId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('articles')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(editingId ? 'Artículo actualizado' : 'Artículo creado');
            setShowForm(false);
            fetchArticles();
        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message);
        }
    };

    if (showForm) {
        return (
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {editingId ? 'Editar Artículo' : 'Nuevo Artículo'}
                    </h2>
                    <button
                        onClick={() => setShowForm(false)}
                        className="text-slate-400 hover:text-white"
                    >
                        Cancelar
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="article-title" className="block text-slate-400 mb-2">Título</label>
                            <input
                                id="article-title"
                                type="text"
                                value={formData.title}
                                onChange={handleTitleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="article-slug" className="block text-slate-400 mb-2">Slug (URL)</label>
                            <input
                                id="article-slug"
                                type="text"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="article-content" className="block text-slate-400 mb-2">Contenido (Markdown)</label>
                        <textarea
                            id="article-content"
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            className="w-full h-64 bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono"
                            placeholder="# Título\n\nEscribe aquí tu contenido..."
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="article-excerpt" className="block text-slate-400 mb-2">Resumen (Excerpt)</label>
                        <textarea
                            id="article-excerpt"
                            value={formData.excerpt}
                            onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                            className="w-full h-20 bg-slate-900 border border-slate-700 rounded p-3 text-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="article-category" className="block text-slate-400 mb-2">Categoría</label>
                            <select
                                id="article-category"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white"
                            >
                                <option value="news">Noticias</option>
                                <option value="guide">Guía</option>
                                <option value="opinion">Opinión</option>
                                <option value="coverage">Coverage</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="article-gametype" className="block text-slate-400 mb-2">Juego</label>
                            <select
                                id="article-gametype"
                                value={formData.gameType}
                                onChange={e => setFormData({ ...formData, gameType: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white"
                            >
                                <option value="general">General</option>
                                <option value="mtg">Magic: The Gathering</option>
                                <option value="pokemon">Pokémon TCG</option>
                                <option value="lorcana">Lorcana</option>
                                <option value="onepiece">One Piece</option>
                                <option value="starwars">Star Wars</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <ImageUpload
                                currentImageUrl={formData.imageUrl}
                                onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isPublished}
                                onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-500"
                                id="publish-check"
                            />
                            <label htmlFor="publish-check" className="text-white font-bold">Publicar inmediatamente</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isPremium}
                                onChange={e => setFormData({ ...formData, isPremium: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-yellow-500"
                                id="premium-check"
                            />
                            <label htmlFor="premium-check" className="text-yellow-400 font-bold flex items-center gap-1">
                                <span>👑</span> Premium
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-6 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-bold"
                        >
                            Guardar Artículo
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Artículos ({articles.length})</h2>
                <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 font-bold flex items-center gap-2"
                >
                    + Nuevo Artículo
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-500">Cargando...</div>
            ) : articles.length > 0 ? (
                <div className="grid gap-4">
                    {articles.map(article => (
                        <div key={article.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 text-xs rounded uppercase font-bold ${article.is_published ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                                        }`}>
                                        {article.is_published ? 'Publicado' : 'Borrador'}
                                    </span>
                                    <span className="text-slate-400 text-xs px-2 py-0.5 border border-slate-600 rounded uppercase">
                                        {article.game_type}
                                    </span>
                                    {article.is_premium && (
                                        <span className="text-yellow-400 text-xs px-2 py-0.5 border border-yellow-600 rounded uppercase font-bold bg-yellow-900/40">
                                            👑 Premium
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-white">{article.title}</h3>
                                <p className="text-slate-400 text-sm">/{article.slug}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(article)}
                                    className="p-2 text-blue-400 hover:bg-slate-700 rounded"
                                    title="Editar"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDelete(article.id)}
                                    className="p-2 text-red-400 hover:bg-slate-700 rounded"
                                    title="Eliminar"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-800 p-8 rounded-lg text-center text-slate-400 border border-slate-700 border-dashed">
                    No hay artículos creados. ¡Crea el primero!
                </div>
            )}
        </div>
    );
};

export default ArticleManager;
