interface ParsedRow {
    rank: number;
    name: string;
    points: number;
    wins: number;
    losses: number;
    draws: number;
}

export const parseMeleeCSV = (csvText: string): ParsedRow[] => {
    const rows: ParsedRow[] = [];

    // Split by lines
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) return rows;

    // Parse header to find column indices
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    // Find column indices (case-insensitive)
    const rankIdx = header.findIndex(h => h.toLowerCase().includes('rank'));
    const playerIdx = header.findIndex(h => h.toLowerCase().includes('player') || h.toLowerCase().includes('name'));
    const matchRecordIdx = header.findIndex(h => h.toLowerCase().includes('match') && h.toLowerCase().includes('record'));
    const pointsIdx = header.findIndex(h => h.toLowerCase().includes('point'));

    // Validate we found the essential columns
    if (rankIdx === -1 || playerIdx === -1 || matchRecordIdx === -1) {
        throw new Error('CSV no tiene las columnas requeridas (Rank, Player, Match Record)');
    }

    // Parse data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // Split by comma, but handle quoted fields
        const parts = parseCSVLine(line);

        if (parts.length < 3) continue;

        // Parse rank
        const rank = parseInt(parts[rankIdx]);
        if (isNaN(rank)) continue;

        // Parse player name and remove pronouns
        let name = parts[playerIdx].replace(/"/g, '').trim();
        name = name.replace(/\s+(He\/Him|She\/Her|They\/Them|he\/him|she\/her|they\/them)\s*$/i, '').trim();

        // Parse match record (format: W-L-D)
        const matchRecord = parts[matchRecordIdx].replace(/"/g, '').trim();
        const recordMatch = matchRecord.match(/^(\d+)[\-\/](\d+)[\-\/](\d+)$/);

        if (!recordMatch) continue;

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

        if (name && !isNaN(wins) && !isNaN(losses) && !isNaN(draws)) {
            rows.push({ rank, name, points, wins, losses, draws });
        }
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
