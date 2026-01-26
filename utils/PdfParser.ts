

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker (mandatory for pdfjs-dist)
// Using CDN for reliability across different environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export interface ParsedRow {
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

export const parseEventLinkPdf = async (file: File): Promise<ParserResult> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
    });
    const doc = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        // Group items by their vertical position (Y coordinate)
        // items[i].transform[5] is the Y coordinate in PDF.js
        const lineMap: { [key: number]: any[] } = {};

        items.forEach(item => {
            const y = Math.round(item.transform[5]);
            if (!lineMap[y]) lineMap[y] = [];
            lineMap[y].push(item);
        });

        // Sort Y coordinates from top to bottom
        const sortedY = Object.keys(lineMap).map(Number).sort((a, b) => b - a);

        sortedY.forEach(y => {
            // Sort items in this line by X coordinate (transform[4])
            const lineItems = lineMap[y].sort((a, b) => a.transform[4] - b.transform[4]);
            const lineText = lineItems.map(item => item.str).join('  ');
            fullText += lineText + '\n';
        });
    }

    let detectedDate = '';
    const rows: ParsedRow[] = [];
    const lines = fullText.split('\n');

    for (const line of lines) {
        // 1. Try to detect date: "Fecha del evento: 24-01-2026"
        if (!detectedDate && line.includes('Fecha del evento:')) {
            const dateMatch = line.match(/(\d{2}[-/]\d{2}[-/]\d{4})/);
            if (dateMatch) {
                detectedDate = dateMatch[1];
            }
        }

        // 2. Process result rows
        // Format: Rank Name Points TB1 TB2 TB3
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) { // Rank, Name (at least 1 part), Points, and at least 2 TBs
            const rank = parseInt(parts[0]);
            if (!isNaN(rank)) {
                // Find where the numbers end. We expect at least Points and some tie-breakers.
                // In EventLink, we usually have: Points, OMW%, GW%, OGW% (4 numbers)
                // We'll look back from the end of the parts.
                let numbersAtEnd: string[] = [];
                let j = parts.length - 1;

                while (j > 0 && numbersAtEnd.length < 5) { // Max 5 numbers: Pts + up to 4 TBs
                    const val = parts[j].replace('%', '').replace(',', '.');
                    if (!isNaN(parseFloat(val))) {
                        numbersAtEnd.push(val);
                        j--;
                    } else {
                        break;
                    }
                }

                if (numbersAtEnd.length >= 2) { // At least Points and 1 tie-breaker
                    // The "Points" column is the last of the numbers we care about if we read backwards.
                    // If we have 4 numbers (Pts, TB1, TB2, TB3), then Points is at j+1
                    // Wait, if numbersAtEnd = [TB3, TB2, TB1, Pts], then its length is 4.
                    // points is at index 3 in numbersAtEnd.

                    const points = parseInt(numbersAtEnd[numbersAtEnd.length - 1]);
                    const name = parts.slice(1, j + 1).join(' ').trim();

                    if (name &&
                        !name.toLowerCase().includes("nombre") &&
                        !name.toLowerCase().includes("reportar") &&
                        !name.toLowerCase().includes("puesto")) {

                        // Estimation of record
                        const wins = Math.floor(points / 3);
                        const draws = points % 3;
                        const losses = 0; // Estimation

                        rows.push({
                            rank,
                            name,
                            points,
                            wins,
                            draws,
                            losses
                        });
                    }
                }
            }
        }
    }

    return {
        results: rows,
        detectedDate: detectedDate || undefined
    };
};
