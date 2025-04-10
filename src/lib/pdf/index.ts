import { supabase } from "@/lib/supabase";
// Import our simple PDF parser
import extractTextFromPdf from "./simple-pdf-parser";

// Interface for document data
export interface DocumentData {
  title: string;
  content: string;
  source_file: string;
  file_type: string;
  category?: "global" | "school-specific";
  source?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Process a PDF file and extract its content
 * @param buffer PDF file buffer
 * @returns Extracted text content and metadata
 */
export async function processPdf(buffer: Buffer): Promise<{
  content: string;
  metadata: Record<string, unknown>;
}> {
  try {
    // Ensure buffer is valid
    if (!buffer || buffer.length === 0) {
      throw new Error("Invalid or empty PDF buffer");
    }

    // Use our simple PDF parser to extract text
    const data = extractTextFromPdf(buffer) as {
      text: string;
      numpages: number;
      numrender: number;
      info: Record<string, unknown>;
      metadata: Record<string, unknown>;
      version: string;
    };

    return {
      content: data.text || "No text content extracted",
      metadata: {
        pageCount: data.numpages || 0,
        info: data.info || {},
        metadata: data.metadata || {},
        version: data.version || "",
      },
    };
  } catch (error) {
    console.error("Error extracting content from PDF:", error);

    // Fallback to simple text extraction if pdf-parse fails
    try {
      // Simple text extraction as fallback
      const text = buffer.toString("utf8", 0, Math.min(buffer.length, 100000));
      const textMatches = text.match(/[a-zA-Z][a-zA-Z\s.,;:!?]{10,}/g) || [];
      const extractedText = textMatches.join("\n");

      return {
        content: extractedText || "No text content extracted",
        metadata: {
          pageCount: 1,
          info: { title: "Extracted document", author: "Unknown" },
          metadata: {},
          version: "1.0",
        },
      };
    } catch {
      // If even the fallback fails, throw the original error
      throw new Error(
        `Failed to extract content from PDF: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

/**
 * Store document data in the database
 * @param documentData Document data to store
 * @returns ID of the created document record
 */
export async function storeDocument(
  documentData: DocumentData
): Promise<string> {
  try {
    // Sanitize content to prevent Unicode escape sequence errors
    const sanitizedData = {
      ...documentData,
      content: sanitizeText(documentData.content),
    };

    const { data, error } = await supabase
      .from("documents")
      .insert(sanitizedData)
      .select("id")
      .single();

    if (error) {
      console.error("Error storing document in database:", error);
      throw new Error(`Failed to store document: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error("Error storing document:", error);
    throw new Error(
      `Failed to store document: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Sanitize text to prevent database errors
 * @param text Text to sanitize
 * @returns Sanitized text
 */
function sanitizeText(text: string): string {
  return (
    text
      // Remove control characters
      .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "")
      // Remove Unicode escape sequences
      .replace(/\\u[0-9a-fA-F]{4}/g, "")
      // Replace null bytes
      .replace(/\0/g, "")
      // Limit length to prevent database errors
      .substring(0, 1000000)
  );
}

/**
 * Search for documents in the database
 * @param query Search query
 * @returns Array of matching documents
 */
export async function searchDocuments(
  query: string
): Promise<Array<{ id: string; title: string; content: string }>> {
  try {
    // Use full-text search
    const { data, error } = await supabase
      .from("documents")
      .select("id, title, content")
      .textSearch("content", query, {
        type: "plain",
        config: "english",
      })
      .limit(5);

    if (error) {
      console.error("Error searching documents:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error searching documents:", error);
    return [];
  }
}

/**
 * Get relevant document content for a specific query
 * @param query User query
 * @returns Relevant content from documents
 */
export async function getRelevantDocumentContent(
  query: string
): Promise<string> {
  try {
    const documents = await searchDocuments(query);

    if (documents.length === 0) {
      return "";
    }

    // Extract relevant sections from the documents
    // This is a simple implementation - could be enhanced with more sophisticated NLP
    let relevantContent = "";

    for (const doc of documents) {
      // Add document title
      relevantContent += `From "${doc.title}":\n\n`;

      // Extract relevant paragraphs containing query terms
      const queryTerms = query
        .toLowerCase()
        .split(" ")
        .filter((term) => term.length > 3);
      const paragraphs = doc.content.split("\n\n");

      const relevantParagraphs = paragraphs
        .filter((paragraph: string) => {
          const paragraphLower = paragraph.toLowerCase();
          return queryTerms.some((term) => paragraphLower.includes(term));
        })
        .slice(0, 3); // Limit to 3 most relevant paragraphs

      relevantContent += relevantParagraphs.join("\n\n") + "\n\n";
    }

    return relevantContent.trim();
  } catch (error) {
    console.error("Error getting relevant document content:", error);
    return "";
  }
}
