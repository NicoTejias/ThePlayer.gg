import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

interface Video {
    id: string;
    youtube_id: string;
    title: string;
    description?: string;
    game_type: string;
    is_featured: boolean;
    created_at: string;
}

const VideoManager: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        youtubeId: '',
        title: '',
        description: '',
        gameType: 'general',
        isFeatured: false
    });

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Error al cargar videos');
        } else {
            setVideos(data || []);
        }
        setLoading(false);
    };

    const extractYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const ytId = extractYoutubeId(formData.youtubeId);

            const { error } = await supabase.from('videos').insert([{
                youtube_id: ytId,
                title: formData.title,
                description: formData.description,
                game_type: formData.gameType,
                is_featured: formData.isFeatured
            }]);

            if (error) throw error;

            toast.success('Video agregado correctamente');
            setShowForm(false);
            setFormData({
                youtubeId: '',
                title: '',
                description: '',
                gameType: 'general',
                isFeatured: false
            });
            fetchVideos();
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar video?')) return;
        const { error } = await supabase.from('videos').delete().eq('id', id);
        if (error) {
            toast.error('Error al eliminar');
        } else {
            toast.success('Video eliminado');
            fetchVideos();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Videos ({videos.length})</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 font-bold flex items-center gap-2"
                >
                    {showForm ? 'Cancelar' : '+ Agregar Video'}
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8 animate-fade-in">
                    <h3 className="text-xl font-bold mb-4">Nuevo Video</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 mb-1">URL de YouTube o ID</label>
                                <input
                                    type="text"
                                    value={formData.youtubeId}
                                    onChange={e => setFormData({ ...formData, youtubeId: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1">Título</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1">Descripción</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-slate-400 mb-1">Juego</label>
                                <select
                                    value={formData.gameType}
                                    onChange={e => setFormData({ ...formData, gameType: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                >
                                    <option value="general">General</option>
                                    <option value="mtg">Magic</option>
                                    <option value="pokemon">Pokémon</option>
                                </select>
                            </div>
                            <div className="flex items-center pt-6">
                                <input
                                    type="checkbox"
                                    checked={formData.isFeatured}
                                    onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                    className="w-5 h-5 rounded bg-slate-900 border-slate-700 mr-2"
                                    id="featured-check"
                                />
                                <label htmlFor="featured-check" className="text-white">Destacado</label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded"
                        >
                            Guardar Video
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map(video => (
                    <div key={video.id} className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                        <div className="aspect-video">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${video.youtube_id}`}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white mb-2 truncate">{video.title}</h3>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 uppercase border border-slate-600 px-2 py-0.5 rounded">
                                    {video.game_type}
                                </span>
                                <button
                                    onClick={() => handleDelete(video.id)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && videos.length === 0 && (
                <div className="text-center text-slate-500 py-12">
                    No hay videos agregados.
                </div>
            )}
        </div>
    );
};

export default VideoManager;
