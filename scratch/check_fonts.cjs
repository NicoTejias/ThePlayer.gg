const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '..', 'Nats premodern.pdf');
const data = fs.readFileSync(pdfPath, 'utf8');

const fonts = data.match(/\/BaseFont\s*\/([A-Za-z0-9+-]+)/g);
const types = data.match(/\/Type\s*\/Font\b/g);
const images = data.match(/\/Subtype\s*\/Image\b/g);

console.log("BaseFonts found:", fonts ? Array.from(new Set(fonts)) : "None");
console.log("/Type /Font occurrences:", types ? types.length : 0);
console.log("Images found (/Subtype /Image):", images ? images.length : 0);
