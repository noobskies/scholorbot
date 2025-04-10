// Script to test PDF processing functionality
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Import the PDF processing function
const { processPdf } = require('../src/lib/pdf');

// Path to the test PDF file
const PDF_PATH = path.join(__dirname, '../src/lib/data/20242025FAFSAPellEligibilityandSAIGuide.pdf');

async function testPdfProcessing() {
  console.log('Testing PDF processing functionality...');
  console.log(`Using PDF file: ${PDF_PATH}`);
  
  try {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    console.log(`PDF file size: ${pdfBuffer.length} bytes`);
    
    // Process the PDF
    console.log('Processing PDF...');
    const result = await processPdf(pdfBuffer);
    
    // Log the results
    console.log('PDF processing successful!');
    console.log(`Extracted ${result.content.length} characters of text`);
    console.log(`Page count: ${result.metadata.pageCount}`);
    
    // Log a sample of the extracted text
    const textSample = result.content.substring(0, 500);
    console.log('\nSample of extracted text:');
    console.log('------------------------');
    console.log(textSample + '...');
    console.log('------------------------');
    
    console.log('\nPDF processing test completed successfully!');
  } catch (error) {
    console.error('Error processing PDF:', error);
    process.exit(1);
  }
}

// Run the test
testPdfProcessing();
