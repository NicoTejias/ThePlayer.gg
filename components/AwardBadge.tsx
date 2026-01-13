
import React from 'react';
import { Award } from '../types';

interface AwardBadgeProps {
    award: Award;
    size?: 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
}

const AwardBadge: React.FC<AwardBadgeProps> = ({ award, size = 'md', showTooltip = true }) => {
    const rarityColors = {
        common: 'from-slate-400 to-slate-600 border-slate-400/50 text-slate-100',
        rare: 'from-sky-400 to-blue-600 border-sky-400/50 text-sky-100',
        epic: 'from-purple-400 to-violet-600 border-purple-400/50 text-purple-100',
        legendary: 'from-yellow-400 to-orange-600 border-yellow-400/50 text-yellow-100 shadow-lg shadow-yellow-500/20 animate-pulse-slow',
    };

    const sizeClasses = {
        sm: 'w-10 h-10 text-xl',
        md: 'w-14 h-14 text-2xl',
        lg: 'w-20 h-20 text-4xl',
    };

    // Fallback icons if not a real URL
    const getIcon = (iconUrl: string) => {
        switch (iconUrl) {
            case 'pioneer_medal': return '🎖️';
            case 'national_trophy': return '🏆';
            case 'store_champ': return '🥇';
            case 'judge_shield': return '🛡️';
            case 'community_heart': return '❤️';
            default: return '🏅';
        }
    };

    return (
        <div className="group relative flex flex-col items-center">
            <div className={`
                ${sizeClasses[size]} 
                rounded-2xl bg-gradient-to-br ${rarityColors[award.rarity]} 
                border-2 flex items-center justify-center 
                transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                shadow-xl relative overflow-hidden
            `}>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 drop-shadow-md">
                    {award.icon_url.startsWith('http') ? (
                        <img src={award.icon_url} alt={award.name} className="w-full h-full object-contain p-2" />
                    ) : (
                        getIcon(award.icon_url)
                    )}
                </span>
            </div>

            {showTooltip && (
                <div className="absolute bottom-full mb-3 hidden group-hover:block z-50 w-48 text-center animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                        <p className={`text-xs font-black uppercase tracking-widest mb-1 
                            ${award.rarity === 'legendary' ? 'text-yellow-400' :
                                award.rarity === 'epic' ? 'text-purple-400' :
                                    award.rarity === 'rare' ? 'text-sky-400' : 'text-slate-400'}
                        `}>
                            {award.rarity}
                        </p>
                        <h4 className="text-white font-bold text-sm leading-tight">{award.name}</h4>
                        <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">{award.description}</p>
                        <div className="absolute top-full left-1/2 -ml-2 border-8 border-transparent border-t-slate-900"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AwardBadge;
