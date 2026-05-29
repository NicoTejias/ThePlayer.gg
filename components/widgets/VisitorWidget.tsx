import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';

const VisitorWidget: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 border-y border-slate-700/50 py-8 md:py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                        {t('visitor_title')}
                    </h2>
                    <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                        {t('visitor_desc')}
                    </p>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all">
                            <div className="text-4xl mb-3">🏆</div>
                            <h3 className="text-lg font-bold text-white mb-2">{t('rankings_oficiales')}</h3>
                            <p className="text-sm text-slate-400">{t('visitor_rankings_desc')}</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all">
                            <div className="text-4xl mb-3">🎯</div>
                            <h3 className="text-lg font-bold text-white mb-2">{t('visitor_events')}</h3>
                            <p className="text-sm text-slate-400">{t('visitor_events_desc')}</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 hover:border-pink-500/50 transition-all">
                            <div className="text-4xl mb-3">👥</div>
                            <h3 className="text-lg font-bold text-white mb-2">{t('visitor_community')}</h3>
                            <p className="text-sm text-slate-400">{t('visitor_community_desc')}</p>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex justify-center items-center">
                        <Link
                            to="/auth?mode=register"
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-2xl shadow-blue-500/30 transition-all transform hover:scale-105 hover:-translate-y-1 border border-white/10"
                        >
                            🚀 {t('visitor_register')}
                        </Link>
                    </div>

                    {/* Trust Indicators */}

                </div>
            </div>
        </div>
    );
};

export default VisitorWidget;
