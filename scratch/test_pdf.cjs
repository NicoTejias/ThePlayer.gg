const fs = require('fs');
const path = require('path');

async function run() {
    console.log("Loading pdfjs-dist...");
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

    const pdfPath = path.join(__dirname, '..', 'Nats premodern.pdf');
    const data = new Uint8Array(fs.readFileSync(pdfPath));

    const loadingTask = pdfjsLib.getDocument({ data });
    const doc = await loadingTask.promise;

    console.log(`Number of pages: ${doc.numPages}`);

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items;
        console.log(`Page ${i} text items count: ${items.length}`);
        if (items.length > 0) {
            console.log(`Sample items from Page ${i}:`, items.slice(0, 5).map(item => ({ str: item.str, transform: item.transform })));
        }
    }
}

run().catch(err => console.error(err));
