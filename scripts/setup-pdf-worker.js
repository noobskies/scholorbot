// Script to copy the PDF.js worker file and standard fonts to the public directory
const fs = require('fs');
const path = require('path');

// Paths for worker file
const WORKER_SRC = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');
const WORKER_DEST = path.join(__dirname, '../public/pdf.worker.min.js');

// Paths for standard fonts
const FONTS_SRC_DIR = path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts');
const FONTS_DEST_DIR = path.join(__dirname, '../public/standard_fonts');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy the worker file
console.log(`Copying PDF.js worker from ${WORKER_SRC} to ${WORKER_DEST}`);
try {
  fs.copyFileSync(WORKER_SRC, WORKER_DEST);
  console.log('PDF.js worker file copied successfully!');
} catch (error) {
  console.error('Error copying PDF.js worker file:', error);
  process.exit(1);
}

// Create the fonts destination directory if it doesn't exist
if (!fs.existsSync(FONTS_DEST_DIR)) {
  fs.mkdirSync(FONTS_DEST_DIR, { recursive: true });
  console.log(`Created directory: ${FONTS_DEST_DIR}`);
}

// Copy all font files
try {
  const fontFiles = fs.readdirSync(FONTS_SRC_DIR);
  console.log(`Found ${fontFiles.length} standard font files to copy`);

  for (const fontFile of fontFiles) {
    const srcPath = path.join(FONTS_SRC_DIR, fontFile);
    const destPath = path.join(FONTS_DEST_DIR, fontFile);

    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${fontFile}`);
  }

  console.log('All standard font files copied successfully!');
} catch (error) {
  console.error('Error copying standard font files:', error);
  process.exit(1);
}
