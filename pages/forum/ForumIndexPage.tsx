import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ForumCategory } from '../../types';
import { MessageSquare, Folder, Hash } from 'lucide-react';

const ForumIndexPage: React.FC = () => {
    const [categories, setCategories] = useState<ForumCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('forum_categories')
                .select(`
                    *,
                    boards:forum_boards(*)
                `)
                .order('ordering', { ascending: true });

            if (error) throw error;

            // Sort boards locally if needed or try to order in the query (complex with nested)
            const sortedCategories = (data || []).map((cat: any) => ({
                ...cat,
                boards: (cat.boards || []).sort((a: any, b: any) => a.ordering - b.ordering)
            }));

            setCategories(sortedCategories);
        } catch (error) {
            console.error('Error fetching forum categories:', error);
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

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-sky-500" />
                        Foro de la Comunidad
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Únete a la discusión, comparte estrategias y conecta con otros jugadores.
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                {categories.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700/50">
                        <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No hay categorías disponibles</h3>
                        <p className="text-slate-400">El foro está siendo configurado. Vuelve pronto.</p>
                    </div>
                ) : (
                    categories.map((category) => (
                        <div key={category.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden shadow-lg hover:border-slate-600 transition-all">
                            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
                                <Folder className="w-5 h-5 text-sky-400" />
                                <h2 className="text-xl font-bold text-white">{category.name}</h2>
                            </div>
                            <div className="divide-y divide-slate-700/50">
                                {category.boards && category.boards.length > 0 ? (
                                    category.boards.map((board) => (
                                        <Link
                                            key={board.id}
                                            to={`/foro/${category.slug}/${board.slug}`}
                                            className="block p-6 hover:bg-slate-700/30 transition-colors group"
                                        >
                                            <div className="flex items-start md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-sky-300 group-hover:text-sky-200 flex items-center gap-2 mb-1">
                                                        <Hash className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                                                        {board.name}
                                                    </h3>
                                                    {board.description && (
                                                        <p className="text-slate-400 text-sm">{board.description}</p>
                                                    )}
                                                </div>
                                                <div className="hidden md:flex flex-col items-end text-sm text-slate-500">
                                                    <span className="bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700/50">
                                                        Ver Temas →
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-500 text-sm italic">
                                        No hay sub-foros en esta categoría.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ForumIndexPage;
