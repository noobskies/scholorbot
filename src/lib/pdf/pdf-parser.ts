// Custom wrapper for pdf-parse to avoid test file issues
import pdfParse from "pdf-parse";

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
function parsePdf(
  dataBuffer: Buffer,
  options: PdfParseOptions = {}
): Promise<PdfParseResult> {
  // Override the default options to avoid test file loading
  const customOptions = {
    // Use provided options or defaults
    ...options,
    // Explicitly set max to 0 to parse all pages
    max: options.max || 0,
    // Use a stable version
    version: options.version || "v1.10.100",
  };

  return pdfParse(dataBuffer, customOptions);
}

export default parsePdf;
