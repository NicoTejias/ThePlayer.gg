
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');

async function inspectOperators() {
    const dataBuffer = fs.readFileSync('Moss pioneer 25 nov.pdf');
    const loadingTask = pdfjsLib.getDocument(new Uint8Array(dataBuffer));
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);

    const opList = await page.getOperatorList();
    console.log("Total Operators:", opList.fnArray.length);

    const ops = pdfjsLib.OPS;
    // Count occurrences
    const counts = {};
    for (let fn of opList.fnArray) {
        // Find name of op?
        const name = Object.keys(ops).find(k => ops[k] === fn) || fn;
        counts[name] = (counts[name] || 0) + 1;
    }
    console.log("Operator Counts:", counts);
}

inspectOperators().catch(console.error);
