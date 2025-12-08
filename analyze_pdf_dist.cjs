
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');

async function extractText() {
    const dataBuffer = fs.readFileSync('Moss pioneer 25 nov.pdf');
    const uint8Array = new Uint8Array(dataBuffer);

    const loadingTask = pdfjsLib.getDocument(uint8Array);
    const doc = await loadingTask.promise;

    console.log(`Pages: ${doc.numPages}`);

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();

        // Extract text items
        const textItems = textContent.items.map(item => item.str);
        console.log(`--- Page ${i} ---`);
        console.log(textItems.join('\n'));
    }
}

extractText().catch(console.error);
