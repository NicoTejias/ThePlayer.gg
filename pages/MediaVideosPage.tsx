import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useGame } from '../context/GameContext';
import { GAME_LABELS, GameType } from '../types';
import { Link } from 'react-router-dom';

interface Video {
    id: string;
    youtube_id: string;
    title: string;
    description?: string;
    game_type: string;
    is_featured: boolean;
    is_premium?: boolean;
    created_at: string;
    creator_id?: string;
}

const MediaVideosPage: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentGame } = useGame();
    const [hasAccess, setHasAccess] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch User Access
            const { data: { session } } = await supabase.auth.getSession();
            let userAccess = false;

            if (session) {
                setUserId(session.user.id);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, subscription_tier')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    const isSubscriber = profile.subscription_tier === 'premium' || profile.subscription_tier === 'vip';
                    const isAdmin = profile.role === 'admin';
                    const isStores = profile.role === 'store';
                    if (isSubscriber || isAdmin || isStores) {
                        userAccess = true;
                    }
                }
            }
            setHasAccess(userAccess);

            // 2. Fetch Videos
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error) {
                setVideos(data || []);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    const handleVideoPlay = (video: Video) => {
        if (hasAccess && video.is_premium) {
            // Log view for premium videos on interaction/play attempt
            // Note: Youtube embed auto-play tracking is harder, so we log "Access" here.
            // If creating a dedicated player page, log there. Here we log assuming they watch it.
            if (userId) {
                supabase.from('content_views').insert({
                    user_id: userId,
                    content_id: video.id,
                    content_type: 'video',
                    creator_id: video.creator_id
                }).then(({ error }) => {
                    if (error) console.error("Error log video view", error);
                });
            }
        }
    };

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
                    {filteredVideos.map(video => {
                        const isLocked = video.is_premium && !hasAccess;
                        return (
                            <div key={video.id} className={`bg-slate-800 rounded-xl overflow-hidden border ${isLocked ? 'border-yellow-600/50' : 'border-slate-700'} shadow-xl hover:shadow-2xl transition-all group relative`}>
                                <div className="aspect-video relative overflow-hidden bg-black">
                                    {isLocked ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-sm p-4 text-center">
                                            <div className="w-12 h-12 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center text-2xl mb-2">
                                                🔒
                                            </div>
                                            <h3 className="text-white font-bold text-lg mb-1">Contenido Premium</h3>
                                            <Link to="/suscribirse" className="text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-full transition-colors mt-2">
                                                Suscribirse para ver
                                            </Link>
                                        </div>
                                    ) : null}

                                    {/* Thumbnail Image (simulated from youtube URL) to avoid loading iframe immediately or if locked */}
                                    {/* Actually simplified: Just put the iframe. Only verify access. */}
                                    {/* If locked, we showed Overlay above. Iframe below might still load but user cant click. */}
                                    {/* Better: Don't load iframe if locked to save resources and prevent 'hacking' via inspecting element to see URL? 
                                       Response: The logic below renders iframe unconditionally but puts overlay on top. 
                                       However, user can just delete overlay in devtools. 
                                       Ideally we don't render iframe source if locked. */}

                                    {!isLocked ? (
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${video.youtube_id}`}
                                            title={video.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute inset-0 z-10"
                                            onLoad={() => handleVideoPlay(video)}
                                        // onLoad is not reliable for 'play', but close enough for 'view' if we consider loading as viewing. 
                                        // Real 'play' tracking needs YouTube Player API which is complex.
                                        // For now, we assume if they can see it, they view it.
                                        ></iframe>
                                    ) : (
                                        <img
                                            src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                                            alt="Locked Video"
                                            className="w-full h-full object-cover opacity-30"
                                        />
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${video.game_type === 'mtg' ? 'bg-purple-900/50 text-purple-300' :
                                            video.game_type === 'pokemon' ? 'bg-yellow-900/50 text-yellow-300' :
                                                'bg-slate-700 text-slate-300'
                                            }`}>
                                            {video.game_type}
                                        </span>
                                        <div className="flex gap-2">
                                            {video.is_premium && (
                                                <span className="text-xs font-bold text-yellow-400 flex items-center gap-1 bg-yellow-900/30 px-2 py-1 rounded border border-yellow-600/30">
                                                    <span>👑</span> Premium
                                                </span>
                                            )}
                                            {video.is_featured && (
                                                <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                                                    <span>★</span> Destacado
                                                </span>
                                            )}
                                        </div>
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
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MediaVideosPage;
