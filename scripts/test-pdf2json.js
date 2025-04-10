// Script to test PDF processing with pdf2json
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

// Path to the test PDF file
const PDF_PATH = path.join(__dirname, '../src/lib/data/20242025FAFSAPellEligibilityandSAIGuide.pdf');

async function testPdf2json() {
  console.log('Testing PDF processing with pdf2json...');
  console.log(`Using PDF file: ${PDF_PATH}`);
  
  try {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    console.log(`PDF file size: ${pdfBuffer.length} bytes`);
    
    // Create a temporary file path
    const tempFilePath = path.join(__dirname, '../temp-test.pdf');
    
    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, pdfBuffer);
    
    // Create a new PDF parser
    const pdfParser = new PDFParser(null, 1);
    
    // Parse the PDF
    console.log('Processing PDF...');
    
    // Use promises to handle the async nature of pdf2json
    const parsedPdf = await new Promise((resolve, reject) => {
      // Handle parsing errors
      pdfParser.on('pdfParser_dataError', (errData) => {
        reject(new Error(`PDF parsing error: ${errData.parserError}`));
      });
      
      // Handle successful parsing
      pdfParser.on('pdfParser_dataReady', () => {
        try {
          // Get the raw text content
          const rawText = pdfParser.getRawTextContent();
          
          // Get the number of pages
          const pageCount = pdfParser.data.Pages ? pdfParser.data.Pages.length : 0;
          
          resolve({
            text: rawText,
            pageCount,
          });
        } catch (error) {
          reject(new Error(`Error extracting PDF content: ${error.message}`));
        }
      });
      
      // Load the PDF file
      pdfParser.loadPDF(tempFilePath);
    });
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    // Log the results
    console.log('PDF processing successful!');
    console.log(`Extracted ${parsedPdf.text.length} characters of text`);
    console.log(`Page count: ${parsedPdf.pageCount}`);
    
    // Log a sample of the extracted text
    const textSample = parsedPdf.text.substring(0, 500);
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
testPdf2json();
