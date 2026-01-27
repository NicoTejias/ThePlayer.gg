import React, { useState } from 'react';
import ArticleManager from '../components/cms/ArticleManager';
import VideoManager from '../components/cms/VideoManager';
import ContentCreatorBadge from '../components/ContentCreatorBadge';

const CreatorDashboardPage: React.FC<{ profile?: any }> = ({ profile }) => {
    const [activeTab, setActiveTab] = useState<'articles' | 'videos'>('articles');

    if (!profile) return null;

    return (
        <div className="min-h-screen py-16 animate-fade-in">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-10 border-b border-white/5">
                    <div className="space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-slate-950 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-2xl p-1 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-14 h-14 bg-sky-500/5 rounded-2xl flex items-center justify-center border border-sky-500/20 text-sky-400 font-black text-2xl uppercase relative z-10 transition-transform group-hover:scale-110 duration-500">
                                    {profile.username?.charAt(0) || profile.name?.charAt(0) || 'C'}
                                </div>
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase leading-[0.85]">Creator Hub</h1>
                                    <ContentCreatorBadge size="medium" />
                                </div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3">Gestionando contenido para @{profile.username || profile.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-slate-950/50 p-1.5 rounded-[1.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
                        <button
                            onClick={() => setActiveTab('articles')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-2 ${activeTab === 'articles'
                                ? 'bg-sky-600 text-white shadow-[0_0_20px_rgba(2,132,199,0.3)]'
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span>📝</span> Artículos
                        </button>
                        <button
                            onClick={() => setActiveTab('videos')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-2 ${activeTab === 'videos'
                                ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span>🎥</span> Videos
                        </button>
                    </div>
                </div>

                {/* Content Manager Portal */}
                <div className="mt-16 animate-fade-in-up">
                    <div className="glass-premium rounded-[3rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden p-2">
                        <div className="bg-slate-950/20 rounded-[2.5rem] p-10 border border-white/5 backdrop-blur-md">
                            {activeTab === 'articles' ? (
                                <ArticleManager authorId={profile.id} />
                            ) : (
                                <VideoManager creatorId={profile.id} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatorDashboardPage;
