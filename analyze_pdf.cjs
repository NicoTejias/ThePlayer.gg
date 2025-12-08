
const fs = require('fs');
const pdfLib = require('pdf-parse');

const dataBuffer = fs.readFileSync('Moss pioneer 25 nov.pdf');

// Try with 'new'
try {
    // If it's a class "PDFParse", maybe it takes the buffer in constructor?
    // Or maybe it has a static method? 
    // Usually 'pdf-parse' default export IS the function.
    // The keys suggested it has a class PDFParse.

    // Let's assume it's a proprietary or updated api.
    // I'll try to just dump the text if I can instance it.

    // Attempt 3: Inspect the package.json of the installed node_module to see what exactly I installed.
    const instance = new pdfLib.PDFParse(dataBuffer);
    console.log(instance);
} catch (e) {
    console.log(e);
}
