import fs from "fs";
import path from "path";
import {
  processPdf,
  storeDocument,
  DocumentData,
  searchDocuments as searchDocsFromIndex,
} from "./index";

/**
 * Process a PDF file and extract its content
 * @param filePath Path to the PDF file
 * @returns Extracted text content
 */
export async function extractPdfContent(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await processPdf(dataBuffer);
    return result.content;
  } catch (error) {
    console.error(`Error extracting content from PDF: ${filePath}`, error);
    throw new Error(`Failed to extract content from PDF: ${error}`);
  }
}

/**
 * Extract metadata from a PDF file
 * @param filePath Path to the PDF file
 * @returns Metadata object
 */
interface PdfMetadata {
  pageCount: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: string;
}

export async function extractPdfMetadata(
  filePath: string
): Promise<PdfMetadata> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await processPdf(dataBuffer);

    return {
      pageCount: result.metadata.pageCount as number,
      info: result.metadata.info as Record<string, unknown>,
      metadata: result.metadata.metadata as Record<string, unknown>,
      version: result.metadata.version as string,
    };
  } catch (error) {
    console.error(`Error extracting metadata from PDF: ${filePath}`, error);
    return {
      pageCount: 0,
      info: {},
      metadata: {},
      version: "",
    };
  }
}

/**
 * Process a PDF file and store its content in the database
 * @param filePath Path to the PDF file
 * @returns ID of the created document record
 */
export async function processPdfFile(filePath: string): Promise<string | null> {
  try {
    const fileName = path.basename(filePath);
    const dataBuffer = fs.readFileSync(filePath);
    const { content, metadata } = await processPdf(dataBuffer);

    // Generate a title from the filename
    const title = fileName
      .replace(/\.[^/.]+$/, "") // Remove file extension
      .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between camelCase
      .trim();

    // Create document data
    const documentData: DocumentData = {
      title,
      content,
      source_file: fileName,
      file_type: "pdf",
      metadata,
    };

    // Store in database using the centralized function
    try {
      const documentId = await storeDocument(documentData);
      console.log(`Successfully processed and stored PDF: ${fileName}`);
      return documentId;
    } catch (storeError) {
      console.error("Error storing document in database:", storeError);
      return null;
    }
  } catch (error) {
    console.error(`Error processing PDF file: ${filePath}`, error);
    return null;
  }
}

/**
 * Process all PDF files in a directory
 * @param directoryPath Path to the directory containing PDF files
 * @returns Array of processed document IDs
 */
export async function processAllPdfsInDirectory(
  directoryPath: string
): Promise<string[]> {
  try {
    const files = fs.readdirSync(directoryPath);
    const pdfFiles = files.filter((file) =>
      file.toLowerCase().endsWith(".pdf")
    );

    console.log(`Found ${pdfFiles.length} PDF files in ${directoryPath}`);

    const processedIds: string[] = [];

    for (const pdfFile of pdfFiles) {
      const filePath = path.join(directoryPath, pdfFile);
      const id = await processPdfFile(filePath);

      if (id) {
        processedIds.push(id);
      }
    }

    return processedIds;
  } catch (error) {
    console.error(
      `Error processing PDFs in directory: ${directoryPath}`,
      error
    );
    return [];
  }
}

/**
 * Search for documents in the database
 * @param query Search query
 * @returns Array of matching documents
 */
interface SearchResult {
  id: string;
  title: string;
  content: string;
  source_file?: string;
  file_type?: string;
  created_at?: string;
  last_updated?: string;
}

// Re-export the searchDocuments function from index.ts with our interface
export async function searchDocuments(query: string): Promise<SearchResult[]> {
  try {
    const results = await searchDocsFromIndex(query);

    // Convert to our interface format
    return results.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
    }));
  } catch (error) {
    console.error("Error searching documents:", error);
    return [];
  }
}
