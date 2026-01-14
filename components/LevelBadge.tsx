
import React from 'react';
import { getLevelInfo } from '../utils/levelUtils';

interface LevelBadgeProps {
    pwp: number;
    size?: 'sm' | 'md' | 'lg';
    showTitle?: boolean;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ pwp, size = 'md', showTitle = true }) => {
    const info = getLevelInfo(pwp);

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[10px] gap-1',
        md: 'px-3 py-1 text-xs gap-1.5',
        lg: 'px-4 py-2 text-sm gap-2'
    };

    const colorClasses: Record<string, string> = {
        slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]',
    };

    return (
        <div className={`inline-flex items-center font-black uppercase tracking-tighter border rounded-full ${sizeClasses[size]} ${colorClasses[info.color]}`}>
            <span className="opacity-70">LVL</span>
            <span>{info.level}</span>
            {showTitle && (
                <>
                    <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
                    <span className="italic">{info.title}</span>
                </>
            )}
        </div>
    );
};

export default LevelBadge;
