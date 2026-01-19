import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import ArticleManager from '../components/cms/ArticleManager';
import VideoManager from '../components/cms/VideoManager';

const AdminCMSPage: React.FC = () => {
    const location = useLocation();
    const state = location.state as { openNewArticle?: boolean; openNewVideo?: boolean } | null;

    const [activeTab, setActiveTab] = useState<'articles' | 'videos'>(state?.openNewVideo ? 'videos' : 'articles');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Gestión de Contenidos</h1>
                    <p className="text-slate-400">Publica noticias, guías y videos para la comunidad.</p>
                </div>

                <div className="flex gap-4 mb-8 border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('articles')}
                        className={`pb-4 px-2 font-bold transition-all ${activeTab === 'articles'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        📰 Artículos y Noticias
                    </button>
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`pb-4 px-2 font-bold transition-all ${activeTab === 'videos'
                            ? 'text-red-400 border-b-2 border-red-400'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        🎬 Videos
                    </button>
                </div>

                {activeTab === 'articles' ? <ArticleManager startOpen={!!state?.openNewArticle} /> : <VideoManager startOpen={!!state?.openNewVideo} />}
            </div>
        </div>
    );
};

export default AdminCMSPage;
