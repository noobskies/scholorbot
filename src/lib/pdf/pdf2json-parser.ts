/**
 * PDF parser using pdf2json
 * This implementation is designed to work well with Next.js, especially on the server side
 */

import PDFParser from "pdf2json";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import os from "os";

interface PdfParseResult {
  text: string;
  numpages: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: string;
}

/**
 * Parse a PDF buffer using pdf2json
 * @param buffer - PDF file buffer
 * @returns Promise with parsed PDF data
 */
export async function parsePdfWithPdf2json(
  buffer: Buffer
): Promise<PdfParseResult> {
  try {
    // Generate a unique filename for the temporary file
    const fileName = `${uuidv4()}.pdf`;
    const tempFilePath = path.join(os.tmpdir(), fileName);

    // Write the buffer to a temporary file
    await fs.writeFile(tempFilePath, buffer);

    // Create a new PDF parser
    // Bypass type checking due to incorrect type definitions
    const pdfParser = new (PDFParser as any)(null, 1);

    // Parse the PDF file
    const parsedPdf = await new Promise<PdfParseResult>((resolve, reject) => {
      // Handle parsing errors
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(`PDF parsing error: ${errData.parserError}`));
      });

      // Handle successful parsing
      pdfParser.on("pdfParser_dataReady", () => {
        try {
          // Get the raw text content
          const rawText = (pdfParser as any).getRawTextContent();

          // Get the number of pages
          const pageCount = pdfParser.data.Pages
            ? pdfParser.data.Pages.length
            : 0;

          // Get metadata if available
          const metadata = pdfParser.data.Metadata || {};

          // Get info if available
          const info = pdfParser.data.Info || {};

          resolve({
            text: rawText || "",
            numpages: pageCount,
            info,
            metadata,
            version: (info.PDFFormatVersion as string) || "1.0",
          });
        } catch (error) {
          reject(
            new Error(
              `Error extracting PDF content: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          );
        }
      });

      // Load the PDF file
      pdfParser.loadPDF(tempFilePath);
    });

    // Clean up the temporary file
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      console.warn(`Failed to delete temporary file ${tempFilePath}:`, error);
    }

    return parsedPdf;
  } catch (error) {
    console.error("Error parsing PDF with pdf2json:", error);
    throw new Error(
      `Failed to parse PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
