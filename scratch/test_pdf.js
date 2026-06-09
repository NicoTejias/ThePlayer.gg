const fs = require('fs');
const path = require('path');

async function run() {
    console.log("Loading pdfjs-dist...");
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

    const pdfPath = path.join(__dirname, '..', 'Nats premodern.pdf');
    const data = new Uint8Array(fs.readFileSync(pdfPath));

    console.log("Loading PDF file:", pdfPath);
    const loadingTask = pdfjsLib.getDocument({ data });
    const doc = await loadingTask.promise;

    console.log(`Number of pages: ${doc.numPages}`);
    let fullText = '';

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items;

        const lineMap = {};

        items.forEach(item => {
            const y = Math.round(item.transform[5]);
            if (!lineMap[y]) lineMap[y] = [];
            lineMap[y].push(item);
        });

        const sortedY = Object.keys(lineMap).map(Number).sort((a, b) => b - a);

        sortedY.forEach(y => {
            const lineItems = lineMap[y].sort((a, b) => a.transform[4] - b.transform[4]);
            const lineText = lineItems.map(item => item.str).join('  ');
            fullText += lineText + '\n';
        });
    }

    console.log("=== FIRST 30 LINES OF EXTRACTED TEXT ===");
    const lines = fullText.split('\n');
    for (let i = 0; i < Math.min(30, lines.length); i++) {
        console.log(`[Line ${i+1}]: "${lines[i]}"`);
    }

    console.log("=========================================");

    // Let's run the parsing logic from PdfParser.ts
    const rows = [];
    let detectedDate = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!detectedDate && line.includes('Fecha del evento:')) {
            const dateMatch = line.match(/(\d{2}[-/]\d{2}[-/]\d{4})/);
            if (dateMatch) {
                detectedDate = dateMatch[1];
            }
        }

        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
            const rank = parseInt(parts[0]);
            if (!isNaN(rank)) {
                let numbersAtEnd = [];
                let j = parts.length - 1;

                while (j > 0 && numbersAtEnd.length < 5) {
                    const val = parts[j].replace('%', '').replace(',', '.');
                    if (!isNaN(parseFloat(val))) {
                        numbersAtEnd.push(val);
                        j--;
                    } else {
                        break;
                    }
                }

                if (numbersAtEnd.length >= 2) {
                    const points = parseInt(numbersAtEnd[numbersAtEnd.length - 1]);
                    const name = parts.slice(1, j + 1).join(' ').trim();

                    if (name &&
                        !name.toLowerCase().includes("nombre") &&
                        !name.toLowerCase().includes("reportar") &&
                        !name.toLowerCase().includes("puesto")) {

                        const wins = Math.floor(points / 3);
                        const draws = points % 3;
                        const losses = 0;

                        rows.push({
                            rank,
                            name,
                            points,
                            wins,
                            draws,
                            losses,
                            rawLine: line
                        });
                    }
                }
            }
        }
    }

    console.log(`Parsed rows: ${rows.length}`);
    if (rows.length > 0) {
        console.log("Muestra de filas parseadas:");
        console.log(rows.slice(0, 10));
    } else {
        console.log("No se parseó ninguna fila. Buscando líneas que empiecen por número:");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (/^\d+\s+/.test(line)) {
                console.log(`Línea candidato ${i+1}: "${line}" (parts: ${JSON.stringify(line.split(/\s+/))})`);
            }
        }
    }
}

run().catch(err => console.error(err));
