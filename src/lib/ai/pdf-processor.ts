import { processPdf } from "@/lib/pdf";
import { storeDocumentWithEmbedding } from "./embeddings";
import { chunkDocument } from "./document-chunker";
import { extractScholarshipInfo, generateDocumentSummary } from "./document-analyzer";
import path from "path";

/**
 * Process a PDF file with AI enhancements
 * @param buffer PDF file buffer
 * @param fileName Original file name
 * @param category Document category (global or school-specific)
 * @returns Document ID and processing results
 */
export async function processAndEnhancePdf(
  buffer: Buffer,
  fileName: string,
  category: "global" | "school-specific" = "global"
): Promise<{
  documentId: string;
  title: string;
  summary: string;
  chunkCount: number;
  extractedInfo: any;
}> {
  try {
    // Step 1: Extract text and metadata from PDF
    const { content, metadata } = await processPdf(buffer);

    // Step 2: Generate a title from the filename if not available in metadata
    let title = "";
    if (metadata?.info?.Title) {
      title = metadata.info.Title as string;
    } else {
      // Generate title from filename
      title = path
        .basename(fileName, path.extname(fileName))
        .replace(/[-_]/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .trim();
    }

    // Step 3: Store the document with embedding
    const documentId = await storeDocumentWithEmbedding({
      title,
      content,
      sourceFile: fileName,
      category,
      metadata,
    });

    // Step 4: Process the document in parallel
    const [chunks, summary, scholarshipInfo] = await Promise.all([
      // Chunk the document and generate embeddings for each chunk
      chunkDocument(documentId),
      
      // Generate a summary of the document
      generateDocumentSummary(documentId),
      
      // Extract structured scholarship information
      extractScholarshipInfo(documentId),
    ]);

    return {
      documentId,
      title,
      summary,
      chunkCount: chunks.length,
      extractedInfo: scholarshipInfo,
    };
  } catch (error) {
    console.error("Error in processAndEnhancePdf:", error);
    throw new Error(
      `Failed to process PDF with AI enhancements: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
