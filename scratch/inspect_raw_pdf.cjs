const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '..', 'Nats premodern.pdf');
const data = fs.readFileSync(pdfPath, 'utf8');

console.log("=== PDF HEADER ===");
console.log(data.substring(0, 500));
console.log("==================");

console.log("=== LOOKING FOR METADATA KEYS ===");
const creator = data.match(/\/Creator\s*\(([^)]+)\)/i);
const producer = data.match(/\/Producer\s*\(([^)]+)\)/i);
const font = data.match(/\/FontName\s*\/([A-Za-z0-9+-]+)/g);

console.log("Creator:", creator ? creator[1] : "Not found");
console.log("Producer:", producer ? producer[1] : "Not found");
console.log("Fonts found:", font ? Array.from(new Set(font)).slice(0, 10) : "None");
