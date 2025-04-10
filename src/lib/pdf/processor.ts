import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";
import pdfParse from "pdf-parse";

// Interface for document data
interface DocumentData {
  title: string;
  content: string;
  source_file: string;
  file_type: string;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Process a PDF file and extract its content
 * @param filePath Path to the PDF file
 * @returns Extracted text content
 */
export async function extractPdfContent(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
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
  info: Record<string, string | number | boolean | null>;
  metadata: Record<string, string | number | boolean | null>;
  version: string;
}

export async function extractPdfMetadata(
  filePath: string
): Promise<PdfMetadata> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      pageCount: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version,
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
    const content = await extractPdfContent(filePath);
    const metadata = await extractPdfMetadata(filePath);

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
      metadata: metadata as unknown as Record<
        string,
        string | number | boolean | null
      >,
    };

    // Store in database
    const { data, error } = await supabase
      .from("documents")
      .insert(documentData)
      .select("id")
      .single();

    if (error) {
      console.error("Error storing document in database:", error);
      return null;
    }

    console.log(`Successfully processed and stored PDF: ${fileName}`);
    return data.id;
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
  source_file: string;
  file_type: string;
  created_at: string;
  last_updated: string;
  [key: string]: string | number | boolean | null;
}

export async function searchDocuments(query: string): Promise<SearchResult[]> {
  try {
    // Use the supabase client

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

    // Convert data to SearchResult type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      source_file: item.source_file || "",
      file_type: item.file_type || "",
      created_at: item.created_at || "",
      last_updated: item.last_updated || "",
    }));
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
        .filter((paragraph) => {
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
