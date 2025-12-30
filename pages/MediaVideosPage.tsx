import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useGame } from '../context/GameContext';
import { GAME_LABELS, GameType } from '../types';

interface Video {
    id: string;
    youtube_id: string;
    title: string;
    description?: string;
    game_type: string;
    is_featured: boolean;
    created_at: string;
}

const MediaVideosPage: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentGame } = useGame();

    useEffect(() => {
        const fetchVideos = async () => {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error) {
                setVideos(data || []);
            }
            setLoading(false);
        };

        fetchVideos();
    }, []);

    // Filter videos by current game
    const filteredVideos = videos.filter(video => {
        // If no game_type specified, show in all games
        if (!video.game_type) return true;
        return video.game_type === currentGame;
    });

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in-up">
            <div className="flex flex-col items-center justify-center text-center space-y-6 mb-12">
                <div className="bg-red-900/20 p-6 rounded-full border border-red-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    Videos Destacados
                </h1>
                <p className="text-xl text-slate-400 max-w-lg">
                    Entrevistas, análisis, deck techs y coverage de los mejores torneos.
                </p>
                <div className="h-1 w-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
            </div>

            {filteredVideos.length === 0 ? (
                <div className="text-center text-slate-500 py-12 border border-slate-700 rounded-lg bg-slate-800/50">
                    <p className="text-xl">No hay videos de {GAME_LABELS[currentGame]} publicados.</p>
                    <p className="text-sm mt-2">¡Vuelve pronto para ver contenido nuevo!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredVideos.map(video => (
                        <div key={video.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl hover:shadow-2xl transition-all hover:border-red-500/50 group">
                            <div className="aspect-video relative overflow-hidden">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${video.youtube_id}`}
                                    title={video.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 z-10"
                                ></iframe>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${video.game_type === 'mtg' ? 'bg-purple-900/50 text-purple-300' :
                                        video.game_type === 'pokemon' ? 'bg-yellow-900/50 text-yellow-300' :
                                            'bg-slate-700 text-slate-300'
                                        }`}>
                                        {video.game_type}
                                    </span>
                                    {video.is_featured && (
                                        <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                                            <span>★</span> Destacado
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors line-clamp-2">
                                    {video.title}
                                </h3>
                                {video.description && (
                                    <p className="text-slate-400 text-sm line-clamp-2">
                                        {video.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaVideosPage;
