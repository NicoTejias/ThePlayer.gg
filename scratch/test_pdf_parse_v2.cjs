const fs = require('fs');
const path = require('path');
const nodePdf = require('pdf-parse/node');

console.log("pdf-parse/node export:", nodePdf);

async function test() {
    const pdfPath = path.join(__dirname, '..', 'Nats premodern.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);

    // If nodePdf is a function (like standard pdf-parse)
    const parseFunc = typeof nodePdf === 'function' ? nodePdf : nodePdf.default || nodePdf.PDFParse || nodePdf;
    console.log("Using parse function/class:", parseFunc);

    if (parseFunc.prototype && parseFunc.prototype.load) {
        const parser = new parseFunc();
        await parser.load(dataBuffer);
        const info = await parser.getInfo();
        console.log("Info:", info);
        const text = await parser.getText();
        console.log("Text length:", text.length);
        await parser.destroy();
    } else {
        const result = await parseFunc(dataBuffer);
        console.log("Result pages:", result.numpages);
        console.log("Result text length:", result.text.length);
    }
}

test().catch(err => console.error(err));
