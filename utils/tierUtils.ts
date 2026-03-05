export type RankingTier = 'Bronze' | 'Plata' | 'Oro' | 'Platino' | 'Maestro' | 'Mítico';

export interface TierConfig {
    name: RankingTier;
    minPoints: number;
    color: string;
    bgColor: string;
    icon: string;
}

export const RANKING_TIERS: TierConfig[] = [
    { name: 'Mítico', minPoints: 8000, color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500', icon: '💎' },
    { name: 'Maestro', minPoints: 5000, color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500', icon: '👑' },
    { name: 'Platino', minPoints: 3000, color: 'text-sky-300', bgColor: 'bg-sky-500/10 border-sky-500', icon: '✨' },
    { name: 'Oro', minPoints: 1500, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500', icon: '⭐' },
    { name: 'Plata', minPoints: 500, color: 'text-slate-300', bgColor: 'bg-slate-500/10 border-slate-500', icon: '🥈' },
    { name: 'Bronze', minPoints: 0, color: 'text-amber-600', bgColor: 'bg-amber-600/10 border-amber-600', icon: '🥉' },
];

export const getTier = (points: number): TierConfig => {
    return RANKING_TIERS.find(tier => points >= tier.minPoints) || RANKING_TIERS[RANKING_TIERS.length - 1];
};
