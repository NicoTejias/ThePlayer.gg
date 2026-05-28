import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GAME_LABELS, GAME_LOGOS, GameType } from '../types';
import { supabase } from '../supabaseClient';

const UniverseSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const { setGame } = useGame();
    const [stores, setStores] = useState<any[]>([]);

    useEffect(() => {
        const fetchStores = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('role', 'store')
                .limit(10);
            if (data) setStores(data);
        };
        fetchStores();
    }, []);

    const handleSelectUniverse = (game: GameType) => {
        setGame(game);
        navigate('/home');
    };

    const universes: GameType[] = ['mtg', 'pokemon', 'one_piece', 'lorcana', 'yugioh', 'star_wars', 'flesh_blood', 'digimon', 'alpha_clash'];

    return (
        <div className="min-h-screen bg-[#050510] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse [animation-delay:3s]" />

                {/* Floating particles-like dots (simple CSS) */}
                <div className="absolute inset-0 opacity-20">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="particle-dot"
                            style={{
                                '--left': `${Math.random() * 100}%`,
                                '--top': `${Math.random() * 100}%`,
                                '--duration': `${5 + Math.random() * 10}s`,
                                '--delay': `${Math.random() * 5}s`
                            } as any}
                        />
                    ))}
                </div>
            </div>

            <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
                {/* Logo Section */}
                <div className="mb-16 text-center animate-fade-in-up">
                    <img
                        src="/logotheplayer.png"
                        alt="The Player Logo"
                        className="h-32 md:h-48 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:drop-shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-all duration-700 cursor-pointer hover:scale-105"
                        onClick={() => navigate('/home')}
                    />
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-sky-500 to-transparent"></div>
                        <h1 className="text-slate-400 uppercase tracking-[0.4em] text-xs font-black">
                            Elige tu Universo de Juego
                        </h1>
                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-sky-500 to-transparent"></div>
                    </div>
                </div>

                {/* Universes Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 w-full px-4 max-w-5xl">
                    {universes.map((game, idx) => (
                        <div
                            key={game}
                            onClick={() => handleSelectUniverse(game)}
                            className="group relative flex flex-col items-center gap-6 bg-slate-900/30 backdrop-blur-xl border border-slate-800/50 p-10 rounded-[2.5rem] hover:border-sky-500/50 hover:bg-slate-800/40 transition-all duration-500 cursor-pointer transform hover:-translate-y-3 shadow-2xl hover:shadow-sky-500/20 universe-card"
                            style={{ '--animation-delay': `${idx * 0.1}s` } as any}
                        >
                            <div className={`w-20 h-20 md:w-28 md:h-28 flex items-center justify-center transform group-hover:scale-115 transition-all duration-500 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_20px_var(--color-accent,rgba(59,130,246,0.5))] ${game === 'one_piece' ? 'bg-white/20 shadow-[0_0_40px_rgba(255,255,255,0.2)] rounded-full p-4 backdrop-blur-md' : ''}`}>
                                {GAME_LOGOS[game]?.src ? (
                                    <img src={GAME_LOGOS[game].src} alt={game} className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <span className="text-6xl">{GAME_LOGOS[game]?.emoji || '🎮'}</span>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-sky-400 transition-colors text-center">
                                    {GAME_LABELS[game]}
                                </span>
                                <div className="h-0.5 w-0 group-hover:w-full bg-sky-500 transition-all duration-500 rounded-full"></div>
                            </div>

                            {/* Hover Ray Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                        </div>
                    ))}
                </div>

                {/* Partner Stores Footer Section */}
                <div className="mt-32 w-full text-center animate-fade-in opacity-0 animate-[fade-in_1s_ease-out_0.8s_forwards]">
                    <div className="flex items-center justify-center gap-4 mb-10">
                        <div className="h-[1px] w-16 bg-slate-800"></div>
                        <h2 className="text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">Nuestras Tiendas Asociadas</h2>
                        <div className="h-[1px] w-16 bg-slate-800"></div>
                    </div>

                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 px-8 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
                        {stores.length > 0 ? (
                            stores.map((store, i) => (
                                <div key={i} className="group relative flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border border-slate-800 group-hover:border-sky-500 transition-all duration-500 shadow-2xl p-0.5 bg-slate-900">
                                        {store.avatar_url ? (
                                            <img src={store.avatar_url} alt={store.username} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xl">🏪</div>
                                        )}
                                    </div>
                                    <span className="text-[10px] uppercase font-black text-slate-400 group-hover:text-sky-400 tracking-wider whitespace-nowrap transition-colors">
                                        {store.username}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="flex gap-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-12 h-12 rounded-full bg-slate-800/50 animate-pulse" />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-24 text-slate-700 text-[9px] uppercase tracking-[0.4em] font-black">
                    &copy; {new Date().getFullYear()} ThePlayer.GG &bull; Corporación TCG Chile
                </div>
            </div>

            <style>{`
                .particle-dot {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: white;
                    border-radius: 50%;
                    left: var(--left);
                    top: var(--top);
                    animation: float var(--duration) linear infinite;
                    animation-delay: var(--delay);
                }
                .universe-card {
                    animation: fade-in-up 0.6s ease-out forwards;
                    animation-delay: var(--animation-delay);
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(10px, -15px); }
                    66% { transform: translate(-5px, 10px); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 0.8; }
                }
                .no-scrollbar {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
            `}</style>
        </div>
    );
};

export default UniverseSelectionPage;
