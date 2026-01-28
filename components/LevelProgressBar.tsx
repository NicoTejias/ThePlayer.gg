
import React from 'react';
import { getLevelInfo } from '../utils/levelUtils';

interface LevelProgressBarProps {
    points: number;
    className?: string;
}

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ points, className = '' }) => {
    const info = getLevelInfo(points);

    const colorBarClasses: Record<string, string> = {
        slate: 'from-slate-600 to-slate-400',
        sky: 'from-sky-600 to-sky-400',
        indigo: 'from-indigo-600 to-indigo-400',
        purple: 'from-purple-600 to-purple-400',
        pink: 'from-pink-600 to-pink-400',
        orange: 'from-orange-600 to-orange-400',
        yellow: 'from-yellow-600 to-yellow-400',
    };

    const nextLevelXP = info.xpForNextLevel;
    const currentXP = info.xpForCurrentLevel;

    const progressStyle = { '--progress-width': `${info.progressPercentage}%` } as React.CSSProperties;

    return (
        <div className={`bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 relative overflow-hidden group ${className}`}>
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${info.color}-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-${info.color}-500/10 transition-colors`}></div>

            <div className="flex justify-between items-end relative z-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Progreso de Rango</p>
                    <div className="flex items-center gap-3">
                        <span className={`text-4xl font-black italic tracking-tighter text-white group-hover:scale-110 transition-transform origin-left`}>
                            NVL {info.level}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white bg-${info.color}-500/20 border border-${info.color}-500/30`}>
                            {info.title}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-white italic tracking-tighter">
                        {currentXP} <span className="text-slate-500 text-sm not-italic">/ {nextLevelXP} XP</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Para nivel {info.level + 1}</p>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative h-4 bg-slate-950 rounded-full border border-slate-800 p-0.5 overflow-hidden shadow-inner">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${colorBarClasses[info.color]} progress-bar-fill relative`}
                    style={progressStyle}
                    role="progressbar"
                    aria-valuenow={info.progressPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progreso del nivel ${info.level}`}
                >
                    {/* Animated Shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full animate-level-shimmer"></div>

                    {/* Glow effect at the tip */}
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-md opacity-50`}></div>
                </div>
            </div>


            <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <span>Rango Actual: {info.title}</span>
                <span>Objetivo: {info.nextThreshold} XP totales</span>
            </div>
        </div>
    );
};

export default LevelProgressBar;
