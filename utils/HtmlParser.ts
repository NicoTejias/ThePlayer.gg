
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

    // Helper to clean and parse numbers
    const getNumber = (element: Element | undefined | null) => {
        if (!element || !element.textContent) return NaN;
        return parseInt(element.textContent.trim().replace(/[^\d]/g, ''), 10);
    };

    const getText = (element: Element | undefined | null) => {
        return element?.textContent?.trim() || '';
    };

    // Iterate through rows, skipping header
    // We assume the first row with "Rank" or "Puesto" is header
    let headerFound = false;

    tableRows.forEach((tr) => {
        const tds = tr.querySelectorAll('td, th');
        if (tds.length === 0) return;

        const firstCellText = getText(tds[0]).toLowerCase();
        if (firstCellText.includes('rank') || firstCellText.includes('puesto')) {
            headerFound = true;
            return;
        }

        // We need at least Rank, Name, Points
        if (tds.length < 3) return;

        const rank = getNumber(tds[0]);
        const name = getText(tds[1]);
        const points = getNumber(tds[2]);

        // Record usually in 4th column (index 3) as "W-L-D" or "W/L/D"
        const recordText = getText(tds[3]);
        const recordMatch = recordText.match(/(\d+)[\/\-](\d+)[\/\-](\d+)/);

        let wins = 0, losses = 0, draws = 0;
        if (recordMatch) {
            wins = parseInt(recordMatch[1]);
            losses = parseInt(recordMatch[2]);
            draws = parseInt(recordMatch[3]);
        }

        if (!isNaN(rank) && name && !isNaN(points)) {
            rows.push({
                rank,
                name,
                points,
                wins,
                losses,
                draws
            });
        }
    });

    return rows;
};
