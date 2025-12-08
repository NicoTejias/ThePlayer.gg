

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker (mandatory for pdfjs-dist)
// Use CDN for worker to avoid build issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ParsedRow {
    rank: number;
    name: string;
    points: number;
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

        // Improve Text extraction: sort items by Y to preserve lines
        // Though EventLink is usually tabular, sometimes it's messier.
        // For now, simple join is okay if we assume rows.
        const strings = textContent.items.map((item: any) => item.str);
        fullText += strings.join(' ') + '\n';
    }

    console.log("PDF Text Content:", fullText);

    const rows: ParsedRow[] = [];

    // Improve regex to be even more permissive
    // Looks for: Number -> Text -> Number -> Number -> Number -> Number
    // Handles multi-word names.
    // \d+ (Rank)
    // \s+
    // (.+?) (Name - non greedy)
    // \s+
    // (\d+) (Points)
    // \s+
    // \d+ (OMW)
    // ...
    // Note: The percentages might be single digit or 100.

    // We strictly look for the Points followed by at least 3 numbers (percentages)
    // or end of line.

    const regex = /(\d+)\s+([a-zA-Z0-9\u00C0-\u00FF\s\.]+?)\s+(\d+)\s+\d{1,3}\s+\d{1,3}\s+\d{1,3}/g;

    let match;
    while ((match = regex.exec(fullText)) !== null) {
        // Filter out likely false positives?
        // Rank should be somewhat sequential, but let's just capture all candidates.
        const rank = parseInt(match[1]);
        const name = match[2].trim();
        const points = parseInt(match[3]);

        // Basic validation
        if (!isNaN(rank) && name.length > 2 && !isNaN(points)) {
            rows.push({ rank, name, points });
        }
    }

    return rows;
};
