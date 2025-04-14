import { generateEmbedding } from "./embeddings";
import { supabase } from "@/lib/supabase";
import adminSupabase from "@/lib/supabase/admin";

// Interface for document chunk
interface DocumentChunk {
  document_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

/**
 * Split a document into chunks for better processing and retrieval
 * @param documentId ID of the document to chunk
 * @param chunkSize Target size of each chunk in characters
 * @param chunkOverlap Number of characters to overlap between chunks
 * @returns Array of chunk IDs
 */
export async function chunkDocument(
  documentId: string,
  chunkSize = 4000, // Reduced chunk size for better processing
  chunkOverlap = 200
): Promise<string[]> {
  try {
    // Fetch the document
    const { data: document, error } = await supabase
      .from("documents")
      .select("id, title, content")
      .eq("id", documentId)
      .single();

    if (error || !document) {
      console.error("Error fetching document for chunking:", error);
      throw new Error(`Document not found: ${documentId}`);
    }

    // Split the content into paragraphs
    const paragraphs = document.content.split(/\n\n+/).filter(Boolean);

    // Create chunks by combining paragraphs up to the target chunk size
    const chunks: DocumentChunk[] = [];
    let currentChunk = "";
    let currentParagraphs: string[] = [];

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed the chunk size, save the current chunk
      if (
        currentChunk.length + paragraph.length > chunkSize &&
        currentChunk.length > 0
      ) {
        // Save the current chunk
        chunks.push({
          document_id: documentId,
          chunk_index: chunks.length,
          content: currentChunk,
          metadata: {
            title: document.title,
            paragraphs: currentParagraphs,
          },
        });

        // Start a new chunk with overlap
        const overlapText = currentChunk.slice(-chunkOverlap);
        currentChunk = overlapText + paragraph;
        currentParagraphs = [paragraph];
      } else {
        // Add the paragraph to the current chunk
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
        currentParagraphs.push(paragraph);
      }
    }

    // Add the last chunk if there's anything left
    if (currentChunk.length > 0) {
      chunks.push({
        document_id: documentId,
        chunk_index: chunks.length,
        content: currentChunk,
        metadata: {
          title: document.title,
          paragraphs: currentParagraphs,
        },
      });
    }

    // Generate embeddings for each chunk and store them
    const chunkIds: string[] = [];

    for (const chunk of chunks) {
      // Generate embedding
      const embedding = await generateEmbedding(chunk.content);
      chunk.embedding = embedding;

      // Store the chunk using admin client to bypass RLS
      try {
        console.log(
          `Storing chunk ${chunks.indexOf(chunk) + 1}/${
            chunks.length
          } for document ${documentId}...`
        );
        const { data, error } = await adminSupabase
          .from("document_chunks")
          .insert(chunk)
          .select("id")
          .single();

        if (error) {
          console.error("Error storing document chunk:", error);
          continue;
        }

        console.log(`Successfully stored chunk with ID: ${data.id}`);
        chunkIds.push(data.id);
      } catch (insertError) {
        console.error("Exception storing document chunk:", insertError);
        continue;
      }
    }

    return chunkIds;
  } catch (error) {
    console.error("Error chunking document:", error);
    throw new Error(
      `Failed to chunk document: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Search for relevant document chunks using semantic search
 * @param query The search query
 * @param limit Maximum number of chunks to return
 * @returns Array of relevant document chunks
 */
export async function searchDocumentChunks(
  query: string,
  limit = 5
): Promise<
  Array<{
    id: string;
    document_id: string;
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
  }>
> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar chunks using admin client to bypass RLS
    console.log(
      `Searching for document chunks matching query: "${query.substring(
        0,
        30
      )}..."`
    );
    const { data, error } = await adminSupabase
      .rpc("match_document_chunks", {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
      })
      .select("id, document_id, content, similarity, metadata");

    console.log(`Found ${data?.length || 0} matching document chunks`);
    if (error) {
      console.error("Error in RPC call to match_document_chunks:", error);
    }

    if (error) {
      console.error("Error searching document chunks:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in searchDocumentChunks:", error);
    return [];
  }
}
