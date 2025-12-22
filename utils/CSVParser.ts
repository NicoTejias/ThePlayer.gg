interface ParsedRow {
    rank: number;
    name: string;
    points: number;
    wins: number;
    losses: number;
    draws: number;
}

/**
 * Parser específico para CSV exportado desde Melee.gg
 * Columnas esperadas de Melee:
 * - Rank (posición)
 * - TeamPlayers1Name o TeamPlayers1FirstName + TeamPlayers1LastName (nombre del jugador)
 * - MatchRecord (formato W-L-D)
 * - Points (puntos del torneo)
 */
export const parseMeleeCSV = (csvText: string): ParsedRow[] => {
    const rows: ParsedRow[] = [];

    // Split by lines
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) return rows;

    // Parse header to find column indices
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    console.log('📋 CSV Header detectado. Total columnas:', header.length);

    // ===== DETECCIÓN DE COLUMNAS ESPECÍFICAS DE MELEE =====

    // Rank - buscar exactamente "Rank"
    const rankIdx = header.findIndex(h => h === 'Rank');

    // Points - buscar exactamente "Points"
    const pointsIdx = header.findIndex(h => h === 'Points');

    // MatchRecord - buscar exactamente "MatchRecord"
    const matchRecordIdx = header.findIndex(h => h === 'MatchRecord');

    // Nombre del jugador - priorizar TeamPlayers1Name (nombre completo)
    let playerNameIdx = header.findIndex(h => h === 'TeamPlayers1Name');

    // Si no hay TeamPlayers1Name, buscar FirstName y LastName separados
    const firstNameIdx = header.findIndex(h => h === 'TeamPlayers1FirstName');
    const lastNameIdx = header.findIndex(h => h === 'TeamPlayers1LastName');

    // Fallback: buscar DisplayName
    const displayNameIdx = header.findIndex(h => h === 'TeamPlayers1DisplayName');

    // Determinar qué columna usar para el nombre
    const useFirstLastName = playerNameIdx === -1 && firstNameIdx !== -1 && lastNameIdx !== -1;

    if (playerNameIdx === -1 && !useFirstLastName) {
        // Fallback al DisplayName
        playerNameIdx = displayNameIdx;
    }

    console.log('🔍 Columnas detectadas:', {
        rankIdx,
        playerNameIdx,
        firstNameIdx,
        lastNameIdx,
        matchRecordIdx,
        pointsIdx,
        useFirstLastName
    });

    // Validar columnas requeridas
    if (rankIdx === -1) {
        throw new Error('CSV no tiene la columna "Rank"');
    }
    if (playerNameIdx === -1 && !useFirstLastName) {
        throw new Error('CSV no tiene columna de nombre (TeamPlayers1Name, FirstName/LastName, o DisplayName)');
    }
    if (matchRecordIdx === -1) {
        throw new Error('CSV no tiene la columna "MatchRecord"');
    }

    // Parse data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // Split by comma, but handle quoted fields
        const parts = parseCSVLine(line);

        if (parts.length < Math.max(rankIdx, playerNameIdx, matchRecordIdx) + 1) continue;

        // Parse rank
        const rank = parseInt(parts[rankIdx]);
        if (isNaN(rank)) continue;

        // Parse player name
        let name = '';
        if (useFirstLastName) {
            const firstName = parts[firstNameIdx]?.replace(/"/g, '').trim() || '';
            const lastName = parts[lastNameIdx]?.replace(/"/g, '').trim() || '';
            name = `${firstName} ${lastName}`.trim();
        } else {
            name = parts[playerNameIdx]?.replace(/"/g, '').trim() || '';

            // El formato de Melee suele ser "Apellido, Nombre" - convertir a "Nombre Apellido"
            if (name.includes(',')) {
                const [lastName, firstName] = name.split(',').map(s => s.trim());
                name = `${firstName} ${lastName}`.trim();
            }
        }

        // Remover pronombres si están al final
        name = name.replace(/\s+(He\/Him|She\/Her|They\/Them|he\/him|she\/her|they\/them)\s*$/i, '').trim();

        // Skip si no hay nombre
        if (!name) continue;

        // Parse match record (format: W-L-D)
        const matchRecord = parts[matchRecordIdx]?.replace(/"/g, '').trim() || '';
        const recordMatch = matchRecord.match(/^(\d+)[\-\/](\d+)[\-\/](\d+)$/);

        if (!recordMatch) {
            console.warn(`⚠️ Row ${i}: Formato de MatchRecord inválido: "${matchRecord}"`);
            continue;
        }

        const wins = parseInt(recordMatch[1]);
        const losses = parseInt(recordMatch[2]);
        const draws = parseInt(recordMatch[3]);

        // Parse points (or calculate if not present)
        let points = 0;
        if (pointsIdx !== -1 && parts[pointsIdx]) {
            points = parseInt(parts[pointsIdx].replace(/"/g, ''));
        }
        if (isNaN(points) || points === 0) {
            points = (wins * 3) + draws;
        }

        rows.push({ rank, name, points, wins, losses, draws });
    }

    console.log(`✅ Parseadas ${rows.length} filas correctamente`);

    if (rows.length > 0) {
        console.log('📊 Muestra de datos:', rows.slice(0, 3));
    }

    return rows;
};

// Helper function to parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Add last field
    result.push(current.trim());

    return result;
}
