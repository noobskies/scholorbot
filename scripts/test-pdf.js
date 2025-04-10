// Simple script to test PDF processing
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Path to the test PDF file
const PDF_PATH = path.join(__dirname, '../src/lib/data/20242025FAFSAPellEligibilityandSAIGuide.pdf');

async function testPdf() {
  console.log('Testing PDF processing with pdf-parse...');
  console.log(`Using PDF file: ${PDF_PATH}`);
  
  try {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    console.log(`PDF file size: ${pdfBuffer.length} bytes`);
    
    // Define custom render function
    const renderPage = function(pageData) {
      const renderOptions = {
        normalizeWhitespace: true,
        disableCombineTextItems: false
      };
      
      return pageData.getTextContent(renderOptions)
        .then(function(textContent) {
          let lastY, text = '';
          for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          return text;
        });
    };
    
    // Process the PDF with options
    const options = {
      pagerender: renderPage,
      max: 0, // Parse all pages
      version: 'v1.10.100' // Use a stable version
    };
    
    // Process the PDF
    console.log('Processing PDF...');
    const data = await pdfParse(pdfBuffer, options);
    
    // Log the results
    console.log('PDF processing successful!');
    console.log(`Extracted ${data.text.length} characters of text`);
    console.log(`Page count: ${data.numpages}`);
    
    // Log a sample of the extracted text
    const textSample = data.text.substring(0, 500);
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
testPdf();
