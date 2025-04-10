// Script to verify that pdf2json works with our configuration
const PDFParser = require('pdf2json');

async function verifyPdf2json() {
  console.log('Verifying pdf2json library...');
  
  try {
    // Create a new PDF parser
    const pdfParser = new PDFParser(null, 1);
    
    console.log('Successfully created PDFParser instance');
    console.log('pdf2json library is working correctly!');
  } catch (error) {
    console.error('Error creating PDFParser instance:', error);
    process.exit(1);
  }
}

// Run the verification
verifyPdf2json();
