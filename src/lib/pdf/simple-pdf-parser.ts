/**
 * Simple PDF text extractor that doesn't rely on PDF.js workers
 * This avoids the issues with Next.js and PDF.js worker paths
 */

// Define interfaces for PDF parsing
interface PdfInfo {
  title?: string;
  author?: string;
  [key: string]: string | undefined;
}

interface PdfParseResult {
  text: string;
  numpages: number;
  numrender: number;
  info: PdfInfo;
  metadata: Record<string, string | undefined>;
  version: string;
}

/**
 * Extract text from a PDF buffer using a simple approach
 * @param buffer - PDF file buffer
 * @returns - Extracted text and basic metadata
 */
function extractTextFromPdf(buffer: Buffer): PdfParseResult {
  try {
    // Convert buffer to string
    const pdfContent = buffer.toString('utf8', 0, Math.min(buffer.length, 1000000));

    // Extract text using regex patterns common in PDFs
    let text = '';

    // Extract text between BT and ET tags (Basic Text objects in PDF)
    const btEtRegex = /BT\s*([^]*?)\s*ET/g;
    let match: RegExpExecArray | null;

    while ((match = btEtRegex.exec(pdfContent)) !== null) {
      const textBlock = match[1];

      // Extract text strings (usually in parentheses or angle brackets)
      const textStrings = textBlock.match(/\(([^)]+)\)|\<([^>]+)\>/g) || [];

      for (const str of textStrings) {
        // Clean up the string (remove parentheses or angle brackets)
        const cleaned = str.replace(/^\(|\)$|^\<|\>$/g, '');
        if (cleaned.length > 0) {
          text += cleaned + ' ';
        }
      }

      text += '\\n'; // Add newline after each text block
    }

    // If the above method didn't extract much text, try a more general approach
    if (text.length < 100) {
      // Look for text between parentheses (common in PDF text objects)
      const parenthesesRegex = /\(([^)]{3,})\)/g;
      while ((match = parenthesesRegex.exec(pdfContent)) !== null) {
        if (match[1].trim().length > 0) {
          text += match[1] + ' ';
        }
      }
    }

    // Clean up the text
    text = text
      .replace(/\\n/g, '\n') // Replace escaped newlines
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\\u[0-9a-fA-F]{4}/g, '') // Remove Unicode escape sequences
      .trim();

    // Extract basic metadata
    const titleMatch = pdfContent.match(/\/Title\s*\(([^)]+)\)/);
    const authorMatch = pdfContent.match(/\/Author\s*\(([^)]+)\)/);
    const pageCountMatch = pdfContent.match(/\/Count\s+(\d+)/);

    return {
      text: text || 'No text content could be extracted',
      numpages: pageCountMatch ? parseInt(pageCountMatch[1], 10) : 1,
      numrender: 1,
      info: {
        title: titleMatch ? titleMatch[1] : 'Unknown',
        author: authorMatch ? authorMatch[1] : 'Unknown',
      },
      metadata: {},
      version: '1.0',
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);

    // Return a minimal result on error
    return {
      text: 'Failed to extract text from PDF. Using document as reference only.',
      numpages: 1,
      numrender: 0,
      info: { title: 'Error processing document', author: 'Unknown' },
      metadata: {},
      version: '1.0',
    };
  }
}

export default extractTextFromPdf;
