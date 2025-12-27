import React from 'react';

interface JudgeBadgeProps {
    level: string;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
}

const JudgeBadge: React.FC<JudgeBadgeProps> = ({ level, size = 'medium', showLabel = true }) => {
    const getBadgeConfig = (level: string) => {
        const configs: Record<string, { color: string; gradient: string; icon: string; label: string }> = {
            // MTG Levels
            'level_1': {
                color: 'from-amber-700 to-amber-900',
                gradient: 'bg-gradient-to-br',
                icon: '⚖️',
                label: 'Level 1'
            },
            'level_2': {
                color: 'from-slate-400 to-slate-600',
                gradient: 'bg-gradient-to-br',
                icon: '⚖️',
                label: 'Level 2'
            },
            'level_3': {
                color: 'from-yellow-400 to-yellow-600',
                gradient: 'bg-gradient-to-br',
                icon: '⚖️',
                label: 'Level 3'
            },
            // Pokémon Levels
            'professor': {
                color: 'from-green-500 to-green-700',
                gradient: 'bg-gradient-to-br',
                icon: '🎓',
                label: 'Professor'
            },
            'senior_professor': {
                color: 'from-blue-500 to-blue-700',
                gradient: 'bg-gradient-to-br',
                icon: '🎓',
                label: 'Senior Professor'
            },
            'master_professor': {
                color: 'from-purple-500 to-purple-700',
                gradient: 'bg-gradient-to-br',
                icon: '🎓',
                label: 'Master Professor'
            },
            // General
            'certified': {
                color: 'from-sky-500 to-sky-700',
                gradient: 'bg-gradient-to-br',
                icon: '✓',
                label: 'Certified'
            },
            'advanced': {
                color: 'from-indigo-500 to-indigo-700',
                gradient: 'bg-gradient-to-br',
                icon: '★',
                label: 'Advanced'
            },
            'expert': {
                color: 'from-rose-500 to-rose-700',
                gradient: 'bg-gradient-to-br',
                icon: '★★',
                label: 'Expert'
            },
            // Head Judge
            'head': {
                color: 'from-purple-600 to-pink-600',
                gradient: 'bg-gradient-to-br',
                icon: '👑',
                label: 'Head Judge'
            }
        };

        return configs[level] || configs['certified'];
    };

    const config = getBadgeConfig(level);

    const sizeClasses = {
        small: 'px-2 py-1 text-xs',
        medium: 'px-3 py-1.5 text-sm',
        large: 'px-4 py-2 text-base'
    };

    return (
        <div
            className={`
                inline-flex items-center gap-1.5 rounded-full font-bold
                ${config.gradient} ${config.color}
                ${sizeClasses[size]}
                shadow-lg border border-white/20
                text-white
            `}
        >
            <span>{config.icon}</span>
            {showLabel && <span>{config.label}</span>}
        </div>
    );
};

export default JudgeBadge;
