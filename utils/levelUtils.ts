
export interface LevelInfo {
    level: number;
    title: string;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    totalXP: number;
    progressPercentage: number;
    color: string;
    nextThreshold: number;
}

/**
 * Calculates level and progress based on Player Points.
 * Progression: 
 * Level 1: 0 Puntos
 * Level 2: 50 Puntos (+50)
 * Level 3: 150 Puntos (+100)
 * Level 4: 300 Puntos (+150)
 * Level 5: 500 Puntos (+200)
 * ...
 * Threshold to next level increases by 50 each time.
 */
export const getLevelInfo = (points: number = 0): LevelInfo => {
    let level = 1;
    let xpThreshold = 0;
    let nextThreshold = 50;

    while (points >= nextThreshold && level < 100) { // Cap at level 100 for safety
        level++;
        xpThreshold = nextThreshold;
        nextThreshold = xpThreshold + (level * 50);
    }

    const xpInCurrentLevel = points - xpThreshold;
    const xpNeededForNext = nextThreshold - xpThreshold;
    const progressPercentage = Math.min(100, Math.max(0, Math.floor((xpInCurrentLevel / xpNeededForNext) * 100)));

    const titles = [
        { min: 1, title: 'Novato', color: 'slate' },
        { min: 10, title: 'Duelista', color: 'sky' },
        { min: 20, title: 'Veterano', color: 'indigo' },
        { min: 30, title: 'Vanguardia', color: 'purple' },
        { min: 40, title: 'Maestro', color: 'pink' },
        { min: 50, title: 'Gran Maestro', color: 'orange' },
        { min: 60, title: 'Leyenda', color: 'yellow' },
    ];

    const titleInfo = [...titles].reverse().find(t => level >= t.min) || titles[0];

    return {
        level,
        title: titleInfo.title,
        xpForCurrentLevel: xpInCurrentLevel,
        xpForNextLevel: xpNeededForNext,
        totalXP: points,
        progressPercentage,
        color: titleInfo.color,
        nextThreshold
    };
};
