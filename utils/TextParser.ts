interface ParsedRow {
    rank: number;
    name: string;
    points: number;
    wins: number;
    losses: number;
    draws: number;
}

export const parseEventLinkText = (text: string): ParsedRow[] => {
    const rows: ParsedRow[] = [];

    // Split by lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    for (const line of lines) {
        // Skip header line
        if (line.toLowerCase().includes('puesto') || line.toLowerCase().includes('nombre')) {
            continue;
        }

        // Split by tabs or multiple spaces
        const parts = line.split(/\t+|\s{2,}/).map(p => p.trim());

        if (parts.length < 4) continue; // Need at least: Rank, Name, Points, Record

        const rank = parseInt(parts[0]);
        if (isNaN(rank)) continue; // Skip if first column is not a number

        const name = parts[1];
        const points = parseInt(parts[2]);

        // Parse W/L/D from parts[3] (format: "2/0/1" or "2-0-1")
        const recordMatch = parts[3].match(/(\d+)[\/\-](\d+)[\/\-](\d+)/);

        if (!recordMatch) continue;

        const wins = parseInt(recordMatch[1]);
        const losses = parseInt(recordMatch[2]);
        const draws = parseInt(recordMatch[3]);

        if (!isNaN(rank) && name && !isNaN(points) && !isNaN(wins) && !isNaN(losses) && !isNaN(draws)) {
            rows.push({ rank, name, points, wins, losses, draws });
        }
    }

    return rows;
};
