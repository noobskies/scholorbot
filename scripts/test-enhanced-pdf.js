// Script to test the enhanced PDF processing
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// First, run the setup script to ensure the worker file is available
require('./setup-pdf-worker');

// Import the PDF processing function
const { processPdf } = require('../src/lib/pdf');

// Path to the test PDF file
const PDF_PATH = path.join(__dirname, '../src/lib/data/20242025FAFSAPellEligibilityandSAIGuide.pdf');

async function testEnhancedPdf() {
  console.log('Testing enhanced PDF processing...');
  console.log(`Using PDF file: ${PDF_PATH}`);

  try {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    console.log(`PDF file size: ${pdfBuffer.length} bytes`);

    // Process the PDF
    console.log('Processing PDF with enhanced implementation...');
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

    console.log('\nEnhanced PDF processing test completed successfully!');
  } catch (error) {
    console.error('Error processing PDF with enhanced implementation:', error);
    process.exit(1);
  }
}

// Run the test
testEnhancedPdf();
