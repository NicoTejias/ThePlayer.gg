

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker (mandatory for pdfjs-dist)
// Use CDN for worker to avoid build issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedRow {
    rank: number;
    name: string;
    points: number;
    wins: number;
    losses: number;
    draws: number;
}

export const parseEventLinkPdf = async (file: File): Promise<ParsedRow[]> => {
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

        // Improve Text extraction: join with proper spacing triggers
        // Items usually have x/y coords, but for now simple join suffices if PDF is clean
        const strings = textContent.items.map((item: any) => item.str);
        fullText += strings.join('  ') + '\n';
    }

    console.log("PDF Text Content:", fullText);

    const rows: ParsedRow[] = [];

    // Regex Strategy:
    // 1. Rank (Number)
    // 2. Name (Text, potentially with spaces)
    // 3. Points (Number)
    // 4. OMW% (Decimal/Number)
    // 5. GW% (Decimal/Number)
    // 6. OGW% (Decimal/Number)
    // Note: Sometimes the record (W-L-D) is present, sometimes not directly in the simple line view.
    // If we only have points, we can ESTIMATE record (3pts = 1 win), but ideally the PDF has the record column.
    // Assuming standard "Standings" PDF from EventLink which has: Rank, Name, Points, OMW%, GW%, OGW%
    // IF it doesn't have Record, we calculate wins ~ points/3.

    // Updated Regex for "Rank Name Points OMW% ..."
    const regex = /(\d+)\s+([a-zA-Z0-9\u00C0-\u00FF\s\.\-']{2,})\s+(\d+)\s+[\d\.,]+\s+[\d\.,]+\s+[\d\.,]+/g;

    let match;
    while ((match = regex.exec(fullText)) !== null) {
        const rank = parseInt(match[1]);
        const name = match[2].trim();
        const points = parseInt(match[3]);

        if (!isNaN(rank) && name.length > 1 && !isNaN(points) && !name.includes("Rank") && !name.includes("Name")) {
            // Logic to approximate W-L-D since PDF Standings often lack explicit W-L-D column
            // We assume 3 pts = 1 Win, 1 pt = 1 Draw.
            // This is an estimation. For exact W-L-D, users should use HTML export.

            const wins = Math.floor(points / 3);
            const remainder = points % 3;
            const draws = remainder; // Usually 1 pt per draw
            const losses = 0; // Cannot determine losses from points alone without total rounds

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

    return rows;
};
