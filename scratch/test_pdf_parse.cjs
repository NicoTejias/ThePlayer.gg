const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

console.log("pdf-parse export:", pdfParse);

const pdfPath = path.join(__dirname, '..', 'Nats premodern.pdf');
const dataBuffer = fs.readFileSync(pdfPath);

const parseFunc = typeof pdfParse === 'function' ? pdfParse : pdfParse.default || pdfParse;

parseFunc(dataBuffer).then(function(data) {
    console.log("=== PDF-PARSE METADATA ===");
    console.log("Pages count:", data.numpages);
    console.log("Metadata Info:", data.info);
    console.log("Text length:", data.text.length);
    console.log("=== TEXT PREVIEW ===");
    console.log(data.text.substring(0, 1000));
    console.log("====================");
}).catch(err => {
    console.error("Error parsing pdf:", err);
});
