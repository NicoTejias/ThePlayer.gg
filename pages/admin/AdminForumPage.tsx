import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { ForumCategory, ForumBoard } from '../../types';
import { Folder, Plus, Trash2, Edit, Save, X, Layers } from 'lucide-react';
import { toast } from 'sonner';

const AdminForumPage: React.FC = () => {
    const [categories, setCategories] = useState<ForumCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState<Partial<ForumCategory> | null>(null);
    const [editingBoard, setEditingBoard] = useState<Partial<ForumBoard> | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        fetchForumStructure();
    }, []);

    const fetchForumStructure = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('forum_categories')
                .select(`
                    *,
                    boards:forum_boards(*)
                `)
                .order('ordering', { ascending: true });

            if (error) throw error;

            // Sort boards
            const sorted = (data || []).map((c: any) => ({
                ...c,
                boards: c.boards.sort((a: any, b: any) => a.ordering - b.ordering)
            }));

            setCategories(sorted);
        } catch (error) {
            console.error('Error fetching forum:', error);
            toast.error('Error al cargar estructura del foro');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCategory = async () => {
        if (!editingCategory?.name) return;

        try {
            const slug = editingCategory.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
            const payload = {
                name: editingCategory.name,
                description: editingCategory.description,
                slug: editingCategory.slug || slug,
                ordering: editingCategory.ordering || 0
            };

            if (editingCategory.id) {
                const { error } = await supabase.from('forum_categories').update(payload).eq('id', editingCategory.id);
                if (error) throw error;
                toast.success('Categoría actualizada');
            } else {
                const { error } = await supabase.from('forum_categories').insert(payload);
                if (error) throw error;
                toast.success('Categoría creada');
            }
            setEditingCategory(null);
            fetchForumStructure();
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('¿Estás seguro? Se eliminarán todos los foros y temas dentro de esta categoría.')) return;
        try {
            const { error } = await supabase.from('forum_categories').delete().eq('id', id);
            if (error) throw error;
            toast.success('Categoría eliminada');
            fetchForumStructure();
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    const handleSaveBoard = async () => {
        if (!editingBoard?.name || !selectedCategory) return;

        try {
            const slug = editingBoard.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
            const payload = {
                category_id: selectedCategory,
                name: editingBoard.name,
                description: editingBoard.description,
                slug: editingBoard.slug || slug,
                ordering: editingBoard.ordering || 0
            };

            if (editingBoard.id) {
                const { error } = await supabase.from('forum_boards').update(payload).eq('id', editingBoard.id);
                if (error) throw error;
                toast.success('Sub-foro actualizado');
            } else {
                const { error } = await supabase.from('forum_boards').insert(payload);
                if (error) throw error;
                toast.success('Sub-foro creado');
            }
            setEditingBoard(null);
            fetchForumStructure();
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    const handleDeleteBoard = async (id: string) => {
        if (!confirm('¿Estás seguro? Se eliminarán todos los temas de este sub-foro.')) return;
        try {
            const { error } = await supabase.from('forum_boards').delete().eq('id', id);
            if (error) throw error;
            toast.success('Sub-foro eliminado');
            fetchForumStructure();
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Layers className="w-6 h-6 text-sky-500" />
                Gestión de Foros
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Categories List */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Categorías (Grupos)</h2>
                        <button
                            onClick={() => setEditingCategory({})}
                            className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Nueva
                        </button>
                    </div>

                    {/* Editor Inline */}
                    {editingCategory && (
                        <div className="bg-slate-900/50 p-4 rounded-lg mb-4 border border-sky-500/50">
                            <h3 className="text-sm font-bold text-sky-400 mb-2">{editingCategory.id ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                            <input
                                className="w-full bg-slate-800 mb-2 border border-slate-700 rounded p-2 text-white text-sm"
                                placeholder="Nombre"
                                value={editingCategory.name || ''}
                                onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            />
                            <textarea
                                className="w-full bg-slate-800 mb-2 border border-slate-700 rounded p-2 text-white text-sm"
                                placeholder="Descripción"
                                value={editingCategory.description || ''}
                                onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingCategory(null)} className="px-3 py-1 text-slate-400 hover:text-white text-xs">Cancelar</button>
                                <button onClick={handleSaveCategory} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs">Guardar</button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`p-4 rounded-lg border transition-all cursor-pointer ${selectedCategory === cat.id ? 'bg-sky-900/20 border-sky-500' : 'bg-slate-700/30 border-slate-700 hover:border-slate-600'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <Folder className={`w-5 h-5 ${selectedCategory === cat.id ? 'text-sky-400' : 'text-slate-500'}`} />
                                        <div>
                                            <h3 className="font-bold text-white">{cat.name}</h3>
                                            <p className="text-xs text-slate-400">{cat.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }} className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-sky-400" title="Editar Categoría">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-red-400" title="Eliminar Categoría">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Boards List (Dependent on selection) */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Sub-foros (Boards)</h2>
                        {selectedCategory && (
                            <button
                                onClick={() => setEditingBoard({})}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Nuevo
                            </button>
                        )}
                    </div>

                    {!selectedCategory ? (
                        <div className="text-center py-12 text-slate-500 bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-800">
                            <Layers className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            Selecciona una categoría para ver sus foros
                        </div>
                    ) : (
                        <>
                            {/* Editor Inline */}
                            {editingBoard && (
                                <div className="bg-slate-900/50 p-4 rounded-lg mb-4 border border-emerald-500/50">
                                    <h3 className="text-sm font-bold text-emerald-400 mb-2">{editingBoard.id ? 'Editar Sub-foro' : 'Nuevo Sub-foro'}</h3>
                                    <input
                                        className="w-full bg-slate-800 mb-2 border border-slate-700 rounded p-2 text-white text-sm"
                                        placeholder="Nombre"
                                        value={editingBoard.name || ''}
                                        onChange={e => setEditingBoard({ ...editingBoard, name: e.target.value })}
                                    />
                                    <textarea
                                        className="w-full bg-slate-800 mb-2 border border-slate-700 rounded p-2 text-white text-sm"
                                        placeholder="Descripción"
                                        value={editingBoard.description || ''}
                                        onChange={e => setEditingBoard({ ...editingBoard, description: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingBoard(null)} className="px-3 py-1 text-slate-400 hover:text-white text-xs">Cancelar</button>
                                        <button onClick={handleSaveBoard} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs">Guardar</button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {categories.find(c => c.id === selectedCategory)?.boards?.length === 0 && (
                                    <div className="text-slate-500 text-sm italic py-4">No hay sub-foros creados.</div>
                                )}
                                {categories.find(c => c.id === selectedCategory)?.boards?.map(board => (
                                    <div key={board.id} className="p-4 rounded-lg border border-slate-700 bg-slate-900/30 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-slate-200">{board.name}</h3>
                                            <p className="text-xs text-slate-500">{board.description}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => setEditingBoard(board)} className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-sky-400" title="Editar Sub-foro">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteBoard(board.id)} className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-red-400" title="Eliminar Sub-foro">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminForumPage;
