import { TournamentParseResult } from '../types';

export interface IntegrityWarning {
    type: 'duplicate_player' | 'impossible_score' | 'suspicious_win_rate' | 'low_player_count' | 'duplicate_tournament' | 'date_mismatch' | 'future_date' | 'burst_upload';
    message: string;
    severity: 'low' | 'medium' | 'high';
    affectedPlayers?: string[];
}

/**
 * Genera una huella digital (hash simple) para comparar si dos torneos son idénticos.
 * Se basa en los nombres de los jugadores y sus puntos, ordenados alfabéticamente.
 */
export const getTournamentFingerprint = (results: TournamentParseResult[]): string => {
    return results
        .map(r => `${r.playerName.toLowerCase().trim()}:${r.pwpEarned}`)
        .sort()
        .join('|');
};

/**
 * Analiza los resultados de un torneo antes de subirlo para detectar patrones extraños.
 */
export const checkTournamentIntegrity = (
    results: TournamentParseResult[],
    playerCount: number,
    tournamentType: string,
    context?: {
        fileDate?: string;
        userDate?: string;
        currentDate?: string;
        recentFingerprints?: string[];
        dailyUploadCount?: number;
    }
): IntegrityWarning[] => {
    const warnings: IntegrityWarning[] = [];
    const { fileDate, userDate, currentDate, recentFingerprints, dailyUploadCount } = context || {};

    // 1. Detección de duplicados (jugadores internos en el mismo archivo)
    const names = results.map(r => r.playerName.toLowerCase().trim());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

    if (duplicates.length > 0) {
        warnings.push({
            type: 'duplicate_player',
            message: `Se detectaron jugadores duplicados en el archivo: ${Array.from(new Set(duplicates)).join(', ')}.`,
            severity: 'high',
            affectedPlayers: duplicates
        });
    }

    // 2. Detección de Torneo Duplicado (comparando con otros torneos subidos)
    if (recentFingerprints && recentFingerprints.length > 0) {
        const currentFingerprint = getTournamentFingerprint(results);
        if (recentFingerprints.includes(currentFingerprint)) {
            warnings.push({
                type: 'duplicate_tournament',
                message: 'Este torneo parece ser un duplicado exacto de uno ya subido recientemente (mismos jugadores y resultados).',
                severity: 'high'
            });
        }
    }

    // 3. Validación de Fechas
    if (userDate && currentDate) {
        const uDate = new Date(userDate);
        const cDate = new Date(currentDate);

        // No se pueden subir torneos del futuro
        if (uDate > cDate) {
            warnings.push({
                type: 'future_date',
                message: 'La fecha seleccionada es en el futuro.',
                severity: 'high'
            });
        }

        // Si hay una fecha detectada en el archivo, compararla con la del usuario
        if (fileDate) {
            try {
                const fDateStr = new Date(fileDate).toISOString().split('T')[0];
                const uDateStr = new Date(userDate).toISOString().split('T')[0];

                if (fDateStr !== uDateStr) {
                    warnings.push({
                        type: 'date_mismatch',
                        message: `La fecha detectada en el archivo (${fDateStr}) no coincide con la fecha seleccionada (${uDateStr}).`,
                        severity: 'medium'
                    });
                }
            } catch (e) {
                console.warn("No se pudo comparar la fecha del archivo:", e);
            }
        }
    }

    // 4. Límite de subidas por día (antispam/burst detection)
    if (dailyUploadCount !== undefined && dailyUploadCount >= 5) {
        warnings.push({
            type: 'burst_upload',
            message: `Se han subido ${dailyUploadCount} torneos hoy. Una cantidad inusual de subidas en un solo día será auditada.`,
            severity: 'medium'
        });
    }

    // 5. Jugadores con puntajes sospechosos (Win rates perfectos)
    // Reducimos la alerta a récords extremadamente inusuales (ej: más de 6 victorias perfectas)
    results.forEach(player => {
        const totalMatches = player.wins + player.losses + player.draws;
        if (totalMatches >= 7 && player.wins === totalMatches) {
            warnings.push({
                type: 'suspicious_win_rate',
                message: `El jugador "${player.playerName}" tiene un record perfecto de ${player.wins} rondas.`,
                severity: 'low'
            });
        }
    });

    // 6. Torneos muy pequeños con multiplicadores altos
    if ((tournamentType === 'rcq' || tournamentType === 'premier') && playerCount < 8) {
        warnings.push({
            type: 'low_player_count',
            message: `Un torneo de tipo "${tournamentType}" suele requerir al menos 8 jugadores para ser oficial.`,
            severity: 'medium'
        });
    }

    // 7. Nombre de jugador genérico o incompleto
    results.forEach(player => {
        if (!player.playerName || player.playerName.trim().length < 3) {
            warnings.push({
                type: 'impossible_score',
                message: `Nombre de jugador sospechoso o demasiado corto: "${player.playerName}".`,
                severity: 'medium'
            });
        }
    });

    return warnings;
};
