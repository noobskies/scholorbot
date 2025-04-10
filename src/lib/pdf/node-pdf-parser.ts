/**
 * Node.js specific PDF parser that doesn't rely on workers
 * This implementation is designed to work in server-side environments
 */

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import path from "path";

// Define interfaces for PDF parsing
interface PdfParseOptions {
  pagerender?: (pageData: unknown) => Promise<string>;
  max?: number;
  version?: string;
}

interface PdfParseResult {
  text: string;
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: string;
}

// Node.js canvas factory for server-side rendering
class NodeCanvasFactory {
  create(width: number, height: number) {
    return {
      width,
      height,
      getContext: () => ({
        // Minimal canvas context implementation for text extraction
        _operationsQueue: [],
        rect: () => {},
        fillRect: () => {},
        drawImage: () => {},
        fill: () => {},
        stroke: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        save: () => {},
        restore: () => {},
        transform: () => {},
        scale: () => {},
        rotate: () => {},
        translate: () => {},
        clip: () => {},
        createImageData: () => ({ data: new Uint8Array(0) }),
        getImageData: () => ({ data: new Uint8Array(0) }),
        putImageData: () => {},
      }),
      toBuffer: () => Buffer.alloc(0),
    };
  }

  reset() {}
  destroy() {}
}

/**
 * Process a PDF buffer and extract text content with improved formatting
 * Server-side implementation that doesn't rely on workers
 *
 * @param dataBuffer - PDF file buffer
 * @param options - PDF parse options
 * @returns - Parsed PDF data with properly formatted text
 */
async function parseNodePdf(
  dataBuffer: Buffer,
  options: PdfParseOptions = {}
): Promise<PdfParseResult> {
  try {
    // Convert Buffer to Uint8Array
    const data = new Uint8Array(dataBuffer);

    // Set up PDF.js for Node.js environment
    const standardFontDataUrl = path.join(
      process.cwd(),
      "node_modules/pdfjs-dist/standard_fonts/"
    );

    // Disable worker for server-side rendering
    // @ts-expect-error - disableWorker is a valid property but not in the types
    pdfjsLib.GlobalWorkerOptions.disableWorker = true;

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data,
      disableAutoFetch: true,
      disableStream: true,
      standardFontDataUrl,
      // @ts-expect-error - canvasFactory is valid but not in the types
      canvasFactory: new NodeCanvasFactory(),
      disableRange: true,
    });

    const pdfDocument = await loadingTask.promise;

    // Get document info and metadata
    const info = await pdfDocument.getMetadata();

    // Define custom render function or use default
    const renderPage = options.pagerender || defaultRenderPage;

    // Set max pages to parse
    const max = options.max || 0;
    const numPages =
      max <= 0 ? pdfDocument.numPages : Math.min(max, pdfDocument.numPages);

    // Extract text from pages
    let text = "";
    let numRendered = 0;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const pageText = await renderPage(page);
      text += pageText + "\n\n"; // Add extra newline between pages
      numRendered++;
      page.cleanup();
    }

    return {
      text: text.trim(),
      numpages: pdfDocument.numPages,
      numrender: numRendered,
      info: info.info ? (info.info as unknown as Record<string, unknown>) : {},
      metadata: info.metadata
        ? (info.metadata as unknown as Record<string, unknown>)
        : {},
      version: options.version || "1.0",
    };
  } catch (error) {
    console.error("Error parsing PDF with Node.js:", error);
    throw new Error(
      `Failed to parse PDF in Node.js: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Default page render function with improved text positioning
 * @param pageData - PDF.js page object
 * @returns - Extracted text with proper formatting
 */
async function defaultRenderPage(pageData: unknown): Promise<string> {
  // Type assertion for pageData
  const pdfPage = pageData as {
    getTextContent: () => Promise<{
      items: Array<{ transform: number[]; str: string }>;
    }>;
  };
  const textContent = await pdfPage.getTextContent();

  // Sort text items by vertical position first, then by horizontal position
  const textItems = textContent.items;

  // Group text items by their vertical position (y-coordinate)
  const lineMap = new Map<
    number,
    Array<{ transform: number[]; str: string }>
  >();

  for (const item of textItems) {
    // Get the y-coordinate (transform[5])
    const y = Math.round(item.transform[5] * 100) / 100; // Round to 2 decimal places

    if (!lineMap.has(y)) {
      lineMap.set(y, []);
    }

    lineMap.get(y)!.push(item);
  }

  // Sort lines by y-coordinate (top to bottom)
  const sortedLines = Array.from(lineMap.entries()).sort((a, b) => b[0] - a[0]); // Reverse sort (higher y value = higher on page)

  // For each line, sort items by x-coordinate (left to right)
  let result = "";

  for (const [, lineItems] of sortedLines) {
    // Sort items in this line by x-coordinate
    lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

    // Combine items in this line
    const line = lineItems.map((item) => item.str).join("");

    if (line.trim()) {
      result += line + "\n";
    }
  }

  return result;
}

export default parseNodePdf;
