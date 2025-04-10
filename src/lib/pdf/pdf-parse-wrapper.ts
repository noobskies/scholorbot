/**
 * Custom PDF parser that doesn't rely on test files
 * This is a simplified version of pdf-parse that avoids the ENOENT error
 */

// Import the PDF.js library directly
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Define extended PDFjs type with GlobalWorkerOptions
interface ExtendedPDFjs {
  getDocument: typeof pdfjsLib.getDocument;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

// Define interfaces for PDF parsing
// Use a more generic type to accommodate the actual PDF.js page structure
type PdfJsPage = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTextContent: (options?: any) => Promise<any>;
  cleanup: () => void;
};

interface PdfParseOptions {
  pagerender?: (pageData: PdfJsPage) => Promise<string>;
  max?: number;
  version?: string;
}

interface PdfParseResult {
  text: string;
  numpages: number;
  numrender: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  version: string;
}

/**
 * Process a PDF buffer and extract text content
 * @param dataBuffer - PDF file buffer
 * @param options - PDF parse options
 * @returns - Parsed PDF data
 */
async function parsePdf(
  dataBuffer: Buffer,
  options: PdfParseOptions = {}
): Promise<PdfParseResult> {
  // Set up PDF.js global worker
  // Set the worker source
  (pdfjsLib as ExtendedPDFjs).GlobalWorkerOptions.workerSrc =
    // Using import.meta.resolve would be better but requires additional setup
    // For now, we'll use a direct path that should work in Next.js
    "/pdf.worker.js";

  try {
    // Load the PDF document
    const doc = await pdfjsLib.getDocument({
      data: dataBuffer,
      // Disable the test file loading
      disableAutoFetch: true,
      disableStream: true,
    }).promise;

    // Get document info
    const info = await doc.getMetadata();

    // Define custom render function
    const renderPage = options.pagerender || defaultRenderPage;

    // Set max pages to parse
    const max = options.max || doc.numPages;
    const numPages = max <= 0 ? doc.numPages : Math.min(max, doc.numPages);

    // Extract text from pages
    let text = "";
    let numRendered = 0;

    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const pageText = await renderPage(page);
      text += pageText + "\n";
      numRendered++;
      page.cleanup();
    }

    return {
      text,
      numpages: doc.numPages,
      numrender: numRendered,
      info: info.info || {},
      metadata: info.metadata || {},
      version: "1.0.0",
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw error;
  }
}

/**
 * Default page render function
 * @param pageData - PDF.js page object
 * @returns - Extracted text
 */
async function defaultRenderPage(pageData: PdfJsPage): Promise<string> {
  const renderOptions = {
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  };

  const textContent = await pageData.getTextContent(renderOptions);
  let lastY: number | undefined;
  let text = "";

  for (const item of textContent.items) {
    if (lastY == item.transform[5] || lastY === undefined) {
      text += item.str;
    } else {
      text += "\n" + item.str;
    }
    lastY = item.transform[5];
  }

  return text;
}

export default parsePdf;
