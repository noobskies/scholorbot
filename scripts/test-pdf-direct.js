// Simple script to test PDF processing directly with pdfjs-dist
const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist');

// Set up worker source and standard font data URL
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');

// Set standard font data URL
const STANDARD_FONT_DATA_URL = path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts/');

// Path to the test PDF file
const PDF_PATH = path.join(__dirname, '../src/lib/data/20242025FAFSAPellEligibilityandSAIGuide.pdf');

async function testPdfJsParser() {
  console.log('Testing PDF processing with pdfjs-dist...');
  console.log(`Using PDF file: ${PDF_PATH}`);

  try {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    console.log(`PDF file size: ${pdfBuffer.length} bytes`);

    // Process the PDF
    console.log('Processing PDF...');

    // Convert Buffer to Uint8Array
    const data = new Uint8Array(pdfBuffer);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data,
      disableAutoFetch: true,
      disableStream: true,
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
    });

    const pdfDocument = await loadingTask.promise;
    console.log(`PDF document loaded. Number of pages: ${pdfDocument.numPages}`);

    // Extract text from the first page as a sample
    const page = await pdfDocument.getPage(1);
    const textContent = await page.getTextContent();

    // Process text items
    const textItems = textContent.items;

    // Group text items by their vertical position (y-coordinate)
    const lineMap = new Map();

    for (const item of textItems) {
      // Get the y-coordinate (transform[5])
      const y = Math.round(item.transform[5] * 100) / 100; // Round to 2 decimal places

      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }

      lineMap.get(y).push(item);
    }

    // Sort lines by y-coordinate (top to bottom)
    const sortedLines = Array.from(lineMap.entries())
      .sort((a, b) => b[0] - a[0]); // Reverse sort (higher y value = higher on page)

    // For each line, sort items by x-coordinate (left to right)
    let result = '';

    for (const [_, lineItems] of sortedLines) {
      // Sort items in this line by x-coordinate
      lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

      // Combine items in this line
      const line = lineItems.map(item => item.str).join('');

      if (line.trim()) {
        result += line + '\n';
      }
    }

    // Log the results
    console.log('PDF processing successful!');
    console.log(`Extracted ${result.length} characters of text from first page`);

    // Log a sample of the extracted text
    const textSample = result.substring(0, 500);
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
testPdfJsParser();
