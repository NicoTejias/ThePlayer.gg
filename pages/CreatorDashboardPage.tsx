import React, { useState } from 'react';
import ArticleManager from '../components/cms/ArticleManager';
import VideoManager from '../components/cms/VideoManager';
import ContentCreatorBadge from '../components/ContentCreatorBadge';

const CreatorDashboardPage: React.FC<{ profile?: any }> = ({ profile }) => {
    const [activeTab, setActiveTab] = useState<'articles' | 'videos'>('articles');

    if (!profile) return null;

    return (
        <div className="min-h-screen py-12 animate-fade-in-up">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Panel de Creador</h1>
                            <ContentCreatorBadge size="medium" />
                        </div>
                        <p className="text-lg text-slate-300 mt-2">
                            Gestiona tu contenido, artículos y videos para la comunidad.
                        </p>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                        <div className="w-12 h-12 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/20 text-sky-400 font-bold text-xl uppercase">
                            {profile.username?.charAt(0) || 'P'}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Creador</p>
                            <p className="text-white font-bold">{profile.username}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-slate-700 overflow-x-auto whitespace-nowrap">
                    <button
                        onClick={() => setActiveTab('articles')}
                        className={`pb-4 px-4 font-bold transition-all flex items-center gap-2 ${activeTab === 'articles'
                            ? 'text-sky-400 border-b-2 border-sky-400'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <span>📝</span> Mis Artículos
                    </button>
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`pb-4 px-4 font-bold transition-all flex items-center gap-2 ${activeTab === 'videos'
                            ? 'text-red-400 border-b-2 border-red-400'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <span>🎥</span> Mis Videos
                    </button>
                </div>

                {/* Content Manager */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-1">
                    {activeTab === 'articles' ? (
                        <ArticleManager authorId={profile.id} />
                    ) : (
                        <VideoManager creatorId={profile.id} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreatorDashboardPage;
