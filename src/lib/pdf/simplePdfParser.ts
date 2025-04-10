/**
 * A simple PDF parser that extracts text from a PDF buffer
 * This is a fallback solution when pdf-parse has issues
 */

import { Buffer } from 'buffer';

/**
 * Extract text from a PDF buffer
 * This is a very simple implementation that looks for text between stream and endstream tags
 * It's not perfect but can serve as a fallback when pdf-parse fails
 * 
 * @param buffer PDF file buffer
 * @returns Extracted text and basic metadata
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
  info: Record<string, any>;
  metadata: Record<string, any>;
  version: string;
}> {
  try {
    // Convert buffer to string
    const pdfContent = buffer.toString('utf8', 0, Math.min(buffer.length, 1000000)); // Limit to 1MB to avoid memory issues
    
    // Extract text between stream and endstream tags
    const textChunks: string[] = [];
    let streamStart = pdfContent.indexOf('stream');
    let streamEnd = pdfContent.indexOf('endstream');
    
    while (streamStart !== -1 && streamEnd !== -1 && streamStart < streamEnd) {
      const chunk = pdfContent.substring(streamStart + 6, streamEnd).trim();
      
      // Only add chunks that look like text (contain alphabetic characters)
      if (/[a-zA-Z]{3,}/.test(chunk)) {
        textChunks.push(chunk);
      }
      
      // Find next stream
      streamStart = pdfContent.indexOf('stream', streamEnd);
      if (streamStart !== -1) {
        streamEnd = pdfContent.indexOf('endstream', streamStart);
      }
    }
    
    // Try to extract page count
    const pageCountMatch = pdfContent.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
    const pageCount = pageCountMatch ? parseInt(pageCountMatch[1], 10) : 1;
    
    // Try to extract PDF version
    const versionMatch = pdfContent.match(/%PDF-(\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : '1.0';
    
    // Try to extract title
    const titleMatch = pdfContent.match(/\/Title\s*\(([^)]+)\)/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Try to extract author
    const authorMatch = pdfContent.match(/\/Author\s*\(([^)]+)\)/);
    const author = authorMatch ? authorMatch[1] : '';
    
    return {
      text: textChunks.join('\n\n'),
      numpages: pageCount,
      info: {
        title,
        author,
      },
      metadata: {},
      version,
    };
  } catch (error) {
    console.error('Error in simple PDF parser:', error);
    
    // Return empty data as fallback
    return {
      text: 'Failed to extract text from PDF. Please check the file format.',
      numpages: 0,
      info: {},
      metadata: {},
      version: '1.0',
    };
  }
}
