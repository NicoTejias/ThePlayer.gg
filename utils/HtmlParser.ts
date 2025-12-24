
interface ParsedRow {
    rank: number;
    name: string;
    points: number;
    wins: number;
    losses: number;
    draws: number;
}

interface ParserResult {
    results: ParsedRow[];
    detectedDate?: string;
}

export const parseEventLinkHtml = async (file: File): Promise<ParserResult> => {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const rows: ParsedRow[] = [];
    const tableRows = Array.from(doc.querySelectorAll('table tr'));

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
    let recordIdx = 3;
    let headerFound = false;

    // 1. First pass: Header Detection
    for (let i = 0; i < tableRows.length; i++) {
        const tr = tableRows[i];
        const cells = Array.from(tr.querySelectorAll('td, th'));
        const cellTexts = cells.map(c => getText(c).toLowerCase());

        const hasRank = cellTexts.some(t => t.includes('rank') || t.includes('puesto'));
        const hasName = cellTexts.some(t => t.includes('name') || t.includes('jugador') || t.includes('display'));

        if (hasRank && hasName) {
            headerFound = true;
            rankIdx = cellTexts.findIndex(t => t.includes('rank') || t.includes('puesto'));
            nameIdx = cellTexts.findIndex(t => t.includes('name') || t.includes('jugador') || t.includes('display'));

            const pIdx = cellTexts.findIndex(t => t.includes('point') || t.includes('punto'));
            if (pIdx !== -1) pointsIdx = pIdx;

            const rIdx = cellTexts.findIndex(t => t.includes('record') || t.includes('resultado'));
            if (rIdx !== -1) recordIdx = rIdx;

            // Skip header row in data processing
            tableRows.splice(i, 1);
            break;
        }
    }

    // 2. Data Extraction Helper
    const extractRows = (rIdx: number, nIdx: number, pIdx: number, recIdx: number) => {
        const extracted: ParsedRow[] = [];
        for (const tr of tableRows) {
            const cells = tr.querySelectorAll('td, th');
            if (cells.length < 3) continue;

            const rank = getNumber(cells[rIdx]);
            const nameRaw = getText(cells[nIdx]);
            const points = getNumber(cells[pIdx]);

            const name = nameRaw.split('\n')[0].trim();

            let recordText = "0-0-0";
            if (cells[recIdx]) recordText = getText(cells[recIdx]);
            else {
                // heuristic scan for record pattern
                const allText = Array.from(cells).map(c => getText(c));
                const matchRecord = allText.find(t => /\d+[\-\/]\d+[\-\/]\d+/.test(t));
                if (matchRecord) recordText = matchRecord;
            }

            const recordMatch = recordText.match(/(\d+)[\/\-](\d+)[\/\-](\d+)/);
            let wins = 0, losses = 0, draws = 0;
            if (recordMatch) {
                wins = parseInt(recordMatch[1]);
                losses = parseInt(recordMatch[2]);
                draws = parseInt(recordMatch[3]);
            } else if (!isNaN(points) && points > 0) {
                // Fallback: estimate from points if record is missing
                wins = Math.floor(points / 3);
                draws = points % 3;
            }

            if (!isNaN(rank) && name && !isNaN(points)) {
                extracted.push({ rank, name, points, wins, losses, draws });
            }
        }
        return extracted;
    };

    // 3. Initial Extraction
    let currentRows = extractRows(rankIdx, nameIdx, pointsIdx, recordIdx);

    // 4. Heuristic Validation & Fix (The "Standard" Fix)
    // Check if names are suspicious (high duplication or literal keywords)
    if (currentRows.length > 0) {
        const nameCounts: { [key: string]: number } = {};
        currentRows.forEach(r => nameCounts[r.name] = (nameCounts[r.name] || 0) + 1);
        const uniqueNames = Object.keys(nameCounts).length;
        const duplicationRatio = 1 - (uniqueNames / currentRows.length);
        const mostCommonName = Object.keys(nameCounts).reduce((a, b) => nameCounts[a] > nameCounts[b] ? a : b);

        const isSuspicious = duplicationRatio > 0.5 || mostCommonName.toLowerCase().includes('standard');

        if (isSuspicious) {
            console.log("⚠️ Suspicious Name Column detected (High Duplication). Attempting Smart Detection...");

            // Analyze all columns to find the one with highest cardinality (most unique values)
            const columnStats: { idx: number, uniqueCount: number, isNumeric: boolean }[] = [];

            // Sample first 10 rows to determine max columns
            let maxCols = 0;
            tableRows.slice(0, 10).forEach(tr => maxCols = Math.max(maxCols, tr.querySelectorAll('td, th').length));

            for (let c = 0; c < maxCols; c++) {
                const colValues = new Set<string>();
                let numericCount = 0;

                tableRows.forEach(tr => {
                    const cells = tr.querySelectorAll('td, th');
                    if (cells[c]) {
                        const txt = getText(cells[c]);
                        if (txt) colValues.add(txt);
                        if (!isNaN(Number(txt)) && txt.trim() !== '') numericCount++;
                    }
                });

                columnStats.push({
                    idx: c,
                    uniqueCount: colValues.size,
                    isNumeric: numericCount > (tableRows.length * 0.8) // Mostly numeric
                });
            }

            // Find best candidate: Max unique values, NOT numeric, NOT the rank/points column we already know (optional)
            const bestCandidate = columnStats
                .filter(s => !s.isNumeric)
                .sort((a, b) => b.uniqueCount - a.uniqueCount)[0];

            if (bestCandidate && bestCandidate.idx !== nameIdx) {
                console.log(`✅ Found better Name candidate at index ${bestCandidate.idx} (Unique: ${bestCandidate.uniqueCount})`);
                // Re-extract with new name index
                currentRows = extractRows(rankIdx, bestCandidate.idx, pointsIdx, recordIdx);
            }
        }
    }

    return { results: currentRows };
};
