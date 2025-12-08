
import fs from 'fs';
import pdf from 'pdf-parse';

const dataBuffer = fs.readFileSync('Moss pioneer 25 nov.pdf');

pdf(dataBuffer).then(function (data) {
    // PDF text
    console.log(data.text);
});
