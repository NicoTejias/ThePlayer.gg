
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');
const path = require('path');

// Fix for Node environment in v3
const standardFontsDir = path.join(__dirname, 'node_modules/pdfjs-dist/standard_fonts/');
const cMapDir = path.join(__dirname, 'node_modules/pdfjs-dist/cmaps/');

async function extractText() {
    const dataBuffer = fs.readFileSync('Moss pioneer 25 nov.pdf');
    const uint8Array = new Uint8Array(dataBuffer);

    const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        cMapUrl: cMapDir, // v3 supports path input in node?
        cMapPacked: true,
        standardFontDataUrl: standardFontsDir
    });

    const doc = await loadingTask.promise;

    console.log(`Pages: ${doc.numPages}`);

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();

        const strings = textContent.items.map(item => item.str);

        console.log(`--- Page ${i} ---`);
        console.log(strings.join(' | '));
    }
}

extractText().catch(console.error);
