
interface ParsedRow {
    rank: number;
    name: string;
    points: number;
    wins: number;
    losses: number;
    draws: number;
}

export const parseEventLinkHtml = async (file: File): Promise<ParsedRow[]> => {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const rows: ParsedRow[] = [];
    const tableRows = doc.querySelectorAll('table tr');

    const getText = (element: Element | undefined | null) => {
        return element?.textContent?.trim() || '';
    };

    const getNumber = (element: Element | undefined | null) => {
        if (!element || !element.textContent) return NaN;
        return parseInt(element.textContent.trim().replace(/[^\d]/g, ''), 10);
    };

    let rankIdx = 0;
    let nameIdx = 1;
    let pointsIdx = 2;
    let recordIdx = 3; // Fallback defaults
    let headerFound = false;

    // First pass: Detect Header
    for (let i = 0; i < tableRows.length; i++) {
        const tr = tableRows[i];
        const cells = Array.from(tr.querySelectorAll('td, th'));
        const cellTexts = cells.map(c => getText(c).toLowerCase());

        // Check if this is a header row
        const hasRank = cellTexts.some(t => t.includes('rank') || t.includes('puesto'));
        const hasName = cellTexts.some(t => t.includes('name') || t.includes('jugador') || t.includes('display'));

        if (hasRank && hasName) {
            headerFound = true;
            rankIdx = cellTexts.findIndex(t => t.includes('rank') || t.includes('puesto'));
            nameIdx = cellTexts.findIndex(t => t.includes('name') || t.includes('jugador') || t.includes('display'));

            const pIdx = cellTexts.findIndex(t => t.includes('point') || t.includes('punto'));
            if (pIdx !== -1) pointsIdx = pIdx;

            // Record might be 'match record' or just 'record'
            const rIdx = cellTexts.findIndex(t => t.includes('record') || t.includes('resultado'));
            // If explicit record column is found, use it. Otherwise, we might guess based on pattern later.
            if (rIdx !== -1) recordIdx = rIdx;
            else {
                // Determine record index by elimination? Usually 3 is safe fallback if not found
                // But let's look for a column that looks like X-X-X in the first data row?
                // For now, keep 3 as default or try to find 'Match Record'
            }

            console.log(`Header detected: Rank=${rankIdx}, Name=${nameIdx}, Points=${pointsIdx}, Record=${recordIdx}`);
            continue; // Skip the header row itself
        }

        // Process Data Rows
        if (!headerFound) {
            // Keep looking for header. 
            // If we are deep in the file and haven't found a header, maybe it's headless? 
            // But usually HTML exports have headers.
            continue;
        }

        if (cells.length < 3) continue;

        const rank = getNumber(cells[rankIdx]);
        const nameRaw = getText(cells[nameIdx]);
        const points = getNumber(cells[pointsIdx]);

        // Sometimes name has extra crud, take first line or trim hard
        const name = nameRaw.split('\n')[0].trim();

        // Parse Record
        // If recordIdx is out of bounds or points to empty, try to search for pattern N-N-N in remaining cells
        let recordText = "0-0-0";
        if (cells[recordIdx]) {
            recordText = getText(cells[recordIdx]);
        } else {
            // scan for pattern
            const matchRecord = cellTexts.find(t => /\d+[\-\/]\d+[\-\/]\d+/.test(t));
            if (matchRecord) recordText = matchRecord;
        }

        const recordMatch = recordText.match(/(\d+)[\/\-](\d+)[\/\-](\d+)/);
        let wins = 0, losses = 0, draws = 0;

        if (recordMatch) {
            wins = parseInt(recordMatch[1]);
            losses = parseInt(recordMatch[2]);
            draws = parseInt(recordMatch[3]);
        } else {
            // Heuristic: If we have points but no record, estimate
            // wins = floor(points/3)
            // draws = points % 3
            // This is handled in StoreDashboard, but we parse here.
            // If we really can't find format, return 0-0-0
        }

        if (!isNaN(rank) && name && name.toLowerCase() !== 'standard' && !isNaN(points)) {
            rows.push({
                rank,
                name,
                points,
                wins,
                losses,
                draws
            });
        }
    }

    // Safety fallback: If 0 rows found with header logic (maybe header detection failed),
    // try the naive approach on all rows? 
    // No, better to return empty and let the user know format is unrecognized than return garbage.

    return rows;
};
