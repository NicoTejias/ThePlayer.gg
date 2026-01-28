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
    is_premium?: boolean;
    created_at: string;
}

interface VideoManagerProps {
    creatorId?: string;
    startOpen?: boolean;
}

const VideoManager: React.FC<VideoManagerProps> = ({ creatorId, startOpen = false }) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(startOpen);
    const [isSaving, setIsSaving] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        youtubeId: '',
        title: '',
        description: '',
        gameType: 'general',
        isFeatured: false,
        isPremium: false
    });

    useEffect(() => {
        fetchVideos();
    }, [creatorId]);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('videos')
                .select('*');

            if (creatorId) {
                query = query.eq('creator_id', creatorId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setVideos(data || []);
        } catch (error: any) {
            toast.error('Error al cargar videos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const extractYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }

        if (!formData.youtubeId || !formData.title) {
            toast.error('Por favor completa los campos obligatorios');
            return;
        }

        setIsSaving(true);
        console.log('VideoManager: Iniciando publicación de video...', formData);

        try {
            const ytId = extractYoutubeId(formData.youtubeId);
            console.log('VideoManager: Youtube ID extraído:', ytId);

            // Get current user if creatorId is not provided
            let finalCreatorId = creatorId;
            if (!finalCreatorId) {
                console.log('VideoManager: No se proporcionó creatorId, obteniendo usuario actual...');
                const { data: { user } } = await supabase.auth.getUser();
                finalCreatorId = user?.id;
            }

            if (!finalCreatorId) {
                console.error('VideoManager: Error - No se pudo identificar al autor');
                throw new Error('No se pudo identificar al autor. Por favor reingresa.');
            }

            console.log('VideoManager: Insertando video en la base de datos para creator:', finalCreatorId);
            const { data, error } = await supabase.from('videos').insert([{
                youtube_id: ytId,
                title: formData.title,
                description: formData.description,
                game_type: formData.gameType,
                is_featured: formData.isFeatured,
                is_premium: formData.isPremium,
                creator_id: finalCreatorId
            }]).select();

            if (error) {
                console.error('VideoManager: Error de Supabase al insertar:', error);
                throw error;
            }

            console.log('VideoManager: Video insertado exitosamente:', data);
            toast.success('¡Video publicado con éxito!');
            setShowForm(false);
            setFormData({
                youtubeId: '',
                title: '',
                description: '',
                gameType: 'general',
                isFeatured: false,
                isPremium: false
            });
            fetchVideos();
        } catch (error: any) {
            console.error('VideoManager: Exception en handleSubmit:', error);
            toast.error('Error: ' + (error.message || 'Error desconocido'));
        } finally {
            console.log('VideoManager: Finalizando estado de guardado.');
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar este video?')) return;
        try {
            const { error } = await supabase.from('videos').delete().eq('id', id);
            if (error) throw error;

            toast.success('Video eliminado');
            fetchVideos();
        } catch (error: any) {
            toast.error('Error al eliminar');
            console.error(error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Videos ({videos.length})</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 font-bold flex items-center gap-2 transition-colors"
                >
                    {showForm ? 'Cancelar' : '+ Agregar Video'}
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-xl font-bold mb-4 text-white">Nuevo Video</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="video-url" className="block text-slate-400 mb-1">URL de YouTube o ID</label>
                                <input
                                    id="video-url"
                                    type="text"
                                    value={formData.youtubeId}
                                    onChange={e => setFormData({ ...formData, youtubeId: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="video-title" className="block text-slate-400 mb-1">Título</label>
                                <input
                                    id="video-title"
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="video-desc" className="block text-slate-400 mb-1">Descripción</label>
                            <input
                                id="video-desc"
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label htmlFor="video-game" className="block text-slate-400 mb-1">Juego</label>
                                <select
                                    id="video-game"
                                    value={formData.gameType}
                                    onChange={e => setFormData({ ...formData, gameType: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                >
                                    <option value="general">General</option>
                                    <option value="mtg">Magic: The Gathering</option>
                                    <option value="pokemon">Pokémon TCG</option>
                                    <option value="lorcana">Lorcana</option>
                                    <option value="onepiece">One Piece</option>
                                    <option value="starwars">Star Wars</option>
                                </select>
                            </div>
                            <div className="flex items-center pt-6">
                                <input
                                    type="checkbox"
                                    checked={formData.isFeatured}
                                    onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                    className="w-5 h-5 rounded bg-slate-900 border-slate-700 mr-2 accent-red-500"
                                    id="featured-check"
                                />
                                <label htmlFor="featured-check" className="text-white cursor-pointer select-none">Destacado</label>
                            </div>
                            <div className="flex items-center pt-6">
                                <input
                                    type="checkbox"
                                    checked={formData.isPremium}
                                    onChange={e => setFormData({ ...formData, isPremium: e.target.checked })}
                                    className="w-5 h-5 rounded bg-slate-900 border-slate-700 mr-2 accent-yellow-500"
                                    id="premium-check"
                                />
                                <label htmlFor="premium-check" className="text-yellow-400 font-bold flex items-center gap-1 cursor-pointer select-none">
                                    <span>👑</span> Premium
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg shadow-red-900/20 transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? 'Guardando...' : 'Publicar Video'}
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map(video => (
                    <div key={video.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-500 transition-all group">
                        <div className="aspect-video relative">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${video.youtube_id}`}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="block"
                            ></iframe>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white mb-3 truncate leading-tight">{video.title}</h3>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    <span className="text-[10px] text-slate-400 uppercase border border-slate-600 px-2 py-0.5 rounded font-bold tracking-wider">
                                        {video.game_type}
                                    </span>
                                    {video.is_premium && (
                                        <span className="text-[10px] font-black text-yellow-500 border border-yellow-600/50 px-2 py-0.5 rounded bg-yellow-900/20 uppercase tracking-wider">
                                            👑 Premium
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(video.id)}
                                    className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                                    title="Eliminar Video"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && videos.length === 0 && (
                <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl text-center text-slate-500 py-16">
                    <p className="text-xl">No hay videos agregados aún.</p>
                    <p className="text-sm mt-1">¡Sube tu primer contenido para la comunidad!</p>
                </div>
            )}
        </div>
    );
};

export default VideoManager;
