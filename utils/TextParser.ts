interface ParsedRow {
    rank: number;
    name: string;
    points: number;
    wins: number;
    losses: number;
    draws: number;
}

export interface ParserResult {
    results: ParsedRow[];
    detectedDate?: string;
}

export const parseEventLinkText = (text: string): ParserResult => {
    const rows: ParsedRow[] = [];

    // Split by lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    for (const line of lines) {
        // Skip header lines
        if (line.toLowerCase().includes('puesto') ||
            line.toLowerCase().includes('nombre') ||
            line.toLowerCase().includes('rank') ||
            line.toLowerCase().includes('players')) {
            continue;
        }

        // Split by tabs or multiple spaces
        const parts = line.split(/\t+|\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);

        if (parts.length < 3) continue; // Need at least: Rank, Name, Match Record

        // Try to parse rank (first column)
        const rank = parseInt(parts[0]);
        if (isNaN(rank)) continue; // Skip if first column is not a number

        // Name is in second column
        let name = parts[1];

        // Remove pronouns (He/Him, She/Her, They/Them, etc.)
        name = name.replace(/\s+(He\/Him|She\/Her|They\/Them|he\/him|she\/her|they\/them)\s*$/i, '').trim();

        // Find Match Record column (format: W-L-D or W/L/D)
        let wins = 0, losses = 0, draws = 0;
        let points = 0;
        let foundRecord = false;

        for (let i = 2; i < parts.length; i++) {
            // Try to parse as Match Record first
            const recordMatch = parts[i].match(/^(\d+)[\\/\-](\d+)[\\/\-](\d+)$/);

            if (recordMatch && !foundRecord) {
                wins = parseInt(recordMatch[1]);
                losses = parseInt(recordMatch[2]);
                draws = parseInt(recordMatch[3]);
                foundRecord = true;

                // Points might be in the next column or previous
                // Try next column first
                if (i + 2 < parts.length) {
                    const potentialPoints = parseInt(parts[i + 2]);
                    if (!isNaN(potentialPoints)) {
                        points = potentialPoints;
                    }
                }
                // If not found, try previous column (EventLink format)
                if (points === 0 && i > 2) {
                    const potentialPoints = parseInt(parts[i - 1]);
                    if (!isNaN(potentialPoints)) {
                        points = potentialPoints;
                    }
                }
                break;
            }
        }

        // If we found a valid record, add the row
        if (foundRecord && name && !isNaN(wins) && !isNaN(losses) && !isNaN(draws)) {
            // Calculate points if not found (W*3 + D*1)
            if (points === 0) {
                points = (wins * 3) + draws;
            }

            rows.push({ rank, name, points, wins, losses, draws });
        }
    }

    return { results: rows };
};
