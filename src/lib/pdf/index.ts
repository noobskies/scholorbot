import { supabase } from "@/lib/supabase";
// Import our PDF parsers
import extractTextFromPdf from "./simple-pdf-parser";
import { parsePdfWithPdf2json } from "./pdf2json-parser";

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

    // Use the pdf2json parser which works well in both server and client environments
    try {
      // Parse the PDF using pdf2json
      const data = await parsePdfWithPdf2json(buffer);

      return {
        content: data.text || "No text content extracted",
        metadata: {
          pageCount: data.numpages || 0,
          info: data.info || {},
          metadata: data.metadata || {},
          version: data.version || "",
        },
      };
    } catch (pdfJsError) {
      console.warn(
        "Enhanced PDF parser failed, falling back to simple parser:",
        pdfJsError
      );

      // Fall back to the simple parser if the enhanced parsers fail
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
    }
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
import { hybridSearch } from "@/lib/ai/embeddings";
import { searchDocumentChunks } from "@/lib/ai/document-chunker";
import { generateFollowUpQuestions } from "@/lib/ai/document-analyzer";

export async function getRelevantDocumentContent(
  query: string
): Promise<string> {
  try {
    // Try to use AI-powered search if available (with fallback to regular search)
    let documents = [];
    let useAI = true;

    try {
      console.log("Attempting AI-powered document search for query:", query);

      // First try semantic search on document chunks for more precise results
      console.log("Searching document chunks...");
      const chunks = await searchDocumentChunks(query, 5);
      console.log(`Found ${chunks.length} document chunks`);

      if (chunks.length > 0) {
        // Format chunks into a document-like structure
        documents = chunks.map((chunk) => ({
          id: chunk.document_id,
          title: (chunk.metadata?.title as string) || "Document",
          content: chunk.content,
          similarity: chunk.similarity,
          chunk_id: chunk.id,
        }));
        console.log("Using document chunks for response");
      } else {
        // If no chunks found, try hybrid search on full documents
        console.log(
          "No chunks found, trying hybrid search on full documents..."
        );
        documents = await hybridSearch(query, 5);
        console.log(`Found ${documents.length} documents via hybrid search`);
      }
    } catch (aiError) {
      console.warn("AI search failed, falling back to basic search:", aiError);
      useAI = false;
      // Fall back to the original search method
      console.log("Falling back to basic keyword search...");
      documents = await searchDocuments(query);
      console.log(`Found ${documents.length} documents via basic search`);
    }

    if (documents.length === 0) {
      return "";
    }

    // Extract relevant sections from the documents
    let relevantContent = "";

    // Extract meaningful query terms for matching (used for both AI and non-AI paths)
    const queryTerms = query
      .toLowerCase()
      .split(" ")
      .filter((term) => term.length > 3);

    // If not using AI, calculate relevance scores manually
    if (!useAI) {
      // Calculate a relevance score for each document
      const scoredDocuments = documents.map((doc) => {
        // Basic relevance score based on term frequency
        const content = doc.content.toLowerCase();
        const score = queryTerms.reduce((total, term) => {
          // Count occurrences of the term
          const regex = new RegExp(term, "gi");
          const matches = content.match(regex);
          return total + (matches ? matches.length : 0);
        }, 0);

        return { ...doc, score };
      });

      // Sort documents by relevance score
      documents = scoredDocuments.sort((a, b) => b.score - a.score);
    }

    // Process each document, starting with most relevant
    for (const doc of documents) {
      // Add document title and source information for citation
      relevantContent += `From "${doc.title}" (Document ID: ${doc.id}):\n\n`;

      // If this is a chunk result from AI search, we can use it directly
      if (useAI && "chunk_id" in doc) {
        relevantContent += doc.content + "\n\n";
        continue;
      }

      // For full documents or non-AI search, extract relevant paragraphs
      const paragraphs = doc.content.split(/\n\n+/);

      // Score each paragraph for relevance
      const scoredParagraphs = paragraphs.map((paragraph) => {
        if (paragraph.trim().length < 20) return { paragraph, score: 0 }; // Skip very short paragraphs

        const paragraphLower = paragraph.toLowerCase();
        // Calculate score based on term frequency and paragraph length
        const termMatches = queryTerms.reduce((count, term) => {
          return paragraphLower.includes(term) ? count + 1 : count;
        }, 0);

        // Normalize by paragraph length to avoid favoring very long paragraphs
        // but still give some preference to more comprehensive paragraphs
        const lengthFactor = Math.min(1, paragraph.length / 500);
        const score = termMatches * (0.7 + 0.3 * lengthFactor);

        return { paragraph, score };
      });

      // Sort and select the most relevant paragraphs
      const relevantParagraphs = scoredParagraphs
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3) // Limit to 3 most relevant paragraphs per document
        .map((item) => item.paragraph);

      // If we found relevant paragraphs, add them to the content
      if (relevantParagraphs.length > 0) {
        relevantContent += relevantParagraphs.join("\n\n") + "\n\n";
      } else {
        // If no specific paragraphs matched, include a brief summary
        const summary = doc.content.substring(0, 300) + "...";
        relevantContent += summary + "\n\n";
      }
    }

    // If we have relevant content and AI is available, generate follow-up questions
    if (relevantContent && useAI) {
      try {
        const followUpQuestions = await generateFollowUpQuestions(
          query,
          relevantContent
        );

        if (followUpQuestions.length > 0) {
          relevantContent += "\n\nSuggested follow-up questions:\n";
          followUpQuestions.forEach((question, index) => {
            relevantContent += `${index + 1}. ${question}\n`;
          });
        }
      } catch (error) {
        console.warn("Failed to generate follow-up questions:", error);
      }
    }

    // Limit the content to avoid exceeding token limits
    const maxContentLength = 4000; // Approximately 1000 tokens
    let trimmedContent = relevantContent.trim();

    if (trimmedContent.length > maxContentLength) {
      console.log(
        `Content too large (${trimmedContent.length} chars), trimming to ${maxContentLength} chars`
      );

      // If we have multiple documents, keep only the first one
      const documents = trimmedContent.split(/From ".*?".*?:\n\n/);
      if (documents.length > 2) {
        // First element is empty due to split
        console.log(
          `Found ${
            documents.length - 1
          } document sections, keeping only the first one`
        );
        const firstDocHeader =
          trimmedContent.match(/From ".*?".*?:\n\n/)?.[0] || "";
        trimmedContent =
          firstDocHeader +
          documents[1].substring(0, maxContentLength) +
          "\n\n[Content truncated due to length]";
      } else {
        // Just trim to max length
        trimmedContent =
          trimmedContent.substring(0, maxContentLength) +
          "\n\n[Content truncated due to length]";
      }
    }

    return trimmedContent;
  } catch (error) {
    console.error("Error getting relevant document content:", error);
    return "";
  }
}
