import path from 'path';
import { processAllPdfsInDirectory } from '../src/lib/pdf/processor';

// Directory containing PDF files
const PDF_DIRECTORY = path.join(process.cwd(), 'tmp');

async function importPdfs() {
  console.log('Starting PDF import process...');
  console.log(`Looking for PDFs in: ${PDF_DIRECTORY}`);
  
  try {
    const processedIds = await processAllPdfsInDirectory(PDF_DIRECTORY);
    
    console.log(`Successfully processed ${processedIds.length} PDF files.`);
    console.log('Processed document IDs:', processedIds);
    
    process.exit(0);
  } catch (error) {
    console.error('Error importing PDFs:', error);
    process.exit(1);
  }
}

// Run the import process
importPdfs();
