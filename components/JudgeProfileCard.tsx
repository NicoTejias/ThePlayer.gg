import React from 'react';
import JudgeBadge from './JudgeBadge';

interface JudgeProfileCardProps {
    judge: {
        id: string;
        username: string;
        avatar_url?: string;
        judge_level: string;
        judge_specialties?: string[];
        judge_region?: string;
        judge_bio?: string;
        judge_certification_date?: string;
    };
}

const JudgeProfileCard: React.FC<JudgeProfileCardProps> = ({ judge }) => {
    const getGameIcon = (game: string) => {
        const icons: Record<string, string> = {
            'mtg': '🃏',
            'pokemon': '⚡',
            'lorcana': '✨',
            'onepiece': '🏴‍☠️'
        };
        return icons[game] || '🎮';
    };

    const getGameName = (game: string) => {
        const names: Record<string, string> = {
            'mtg': 'Magic',
            'pokemon': 'Pokémon',
            'lorcana': 'Lorcana',
            'onepiece': 'One Piece'
        };
        return names[game] || game;
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                    {judge.avatar_url ? (
                        <img
                            src={judge.avatar_url}
                            alt={judge.username}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        judge.username.charAt(0).toUpperCase()
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate mb-1">
                        {judge.username}
                    </h3>
                    <JudgeBadge level={judge.judge_level} size="small" />
                </div>
            </div>

            {/* Bio */}
            {judge.judge_bio && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {judge.judge_bio}
                </p>
            )}

            {/* Specialties */}
            {judge.judge_specialties && judge.judge_specialties.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2 font-semibold">Juegos:</p>
                    <div className="flex flex-wrap gap-2">
                        {judge.judge_specialties.map((game) => (
                            <span
                                key={game}
                                className="px-2 py-1 bg-slate-700/50 rounded-md text-xs text-slate-300 flex items-center gap-1"
                            >
                                <span>{getGameIcon(game)}</span>
                                <span>{getGameName(game)}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Region */}
            {judge.judge_region && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{judge.judge_region}</span>
                </div>
            )}

            {/* Certification Date */}
            {judge.judge_certification_date && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-500">
                        Certificado desde {new Date(judge.judge_certification_date).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}
                    </p>
                </div>
            )}
        </div>
    );
};

export default JudgeProfileCard;
