
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const standardFontsDir = path.join(__dirname, 'node_modules/pdfjs-dist/standard_fonts/');
const cMapDir = path.join(__dirname, 'node_modules/pdfjs-dist/cmaps/');

const standardFontsUrl = 'file://' + standardFontsDir.replace(/\\/g, '/') + (standardFontsDir.endsWith(path.sep) ? '' : '/');
const cMapUrl = 'file://' + cMapDir.replace(/\\/g, '/') + (cMapDir.endsWith(path.sep) ? '' : '/');

async function extractText() {
    const dataBuffer = fs.readFileSync('Moss pioneer 25 nov.pdf');
    const uint8Array = new Uint8Array(dataBuffer);

    const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        standardFontDataUrl: standardFontsUrl,
        cMapUrl: cMapUrl,
        cMapPacked: true
    });

    const doc = await loadingTask.promise;

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map(item => ({ str: item.str, x: item.transform[4], y: item.transform[5] }));

        console.log(`--- Page ${i} ---`);
        console.log(textItems.map(t => t.str).join(' | '));
    }
}

extractText().catch(console.error);
