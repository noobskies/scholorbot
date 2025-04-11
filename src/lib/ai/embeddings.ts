import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with the service role key for admin operations
// This bypasses RLS policies
const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : supabase; // Fall back to regular client if service role key is not available

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The dimension of the embeddings from OpenAI's text-embedding-3-small model
const EMBEDDING_DIMENSION = 1536;

/**
 * Generate embeddings for a text using OpenAI's embeddings API
 * @param text The text to generate embeddings for
 * @returns An array of numbers representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Truncate text to avoid token limits (8191 tokens for text-embedding-3-small)
    // Roughly 3-4 tokens per word, so ~2000 words should be safe
    const truncatedText = text.slice(0, 8000);

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: truncatedText,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(
      `Failed to generate embedding: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Store a document with its embedding in the database
 * @param title Document title
 * @param content Document content
 * @param sourceFile Source file name
 * @param metadata Additional metadata
 * @returns ID of the created document
 */
export async function storeDocumentWithEmbedding({
  title,
  content,
  sourceFile,
  category = "global",
  metadata = {},
}: {
  title: string;
  content: string;
  sourceFile: string;
  category?: "global" | "school-specific";
  metadata?: Record<string, unknown>;
}): Promise<string> {
  try {
    // Generate embedding for the document
    const embedding = await generateEmbedding(content);

    // Store document with embedding using admin client to bypass RLS
    console.log(`Storing document with embedding: ${title}`);
    const { data, error } = await adminSupabase
      .from("documents")
      .insert({
        title,
        content,
        source_file: sourceFile,
        file_type: "pdf",
        category,
        embedding,
        metadata,
      })
      .select("id")
      .single();

    console.log(
      error
        ? `Error storing document: ${error.message}`
        : `Document stored with ID: ${data?.id}`
    );

    if (error) {
      console.error("Error storing document with embedding:", error);
      throw new Error(`Failed to store document: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error("Error in storeDocumentWithEmbedding:", error);
    throw new Error(
      `Failed to store document with embedding: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Search for documents using semantic similarity
 * @param query The search query
 * @param limit Maximum number of results to return
 * @param similarityThreshold Minimum similarity score (0-1)
 * @returns Array of matching documents with similarity scores
 */
export async function semanticSearch(
  query: string,
  limit = 5,
  similarityThreshold = 0.7
): Promise<
  Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
  }>
> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Perform vector search using cosine similarity with admin client to bypass RLS
    // Note: This requires the pgvector extension to be enabled in Supabase
    console.log(
      `Performing semantic search for query: "${query.substring(0, 30)}..."`
    );
    const { data, error } = await adminSupabase
      .rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_threshold: similarityThreshold,
        match_count: limit,
      })
      .select("id, title, content, similarity");

    console.log(`Found ${data?.length || 0} semantically matching documents`);
    if (error) {
      console.error("Error in RPC call to match_documents:", error);
    }

    if (error) {
      console.error("Error in semantic search:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in semanticSearch:", error);
    return [];
  }
}

/**
 * Hybrid search combining semantic and keyword search
 * @param query The search query
 * @param limit Maximum number of results to return
 * @returns Array of matching documents
 */
export async function hybridSearch(
  query: string,
  limit = 5
): Promise<Array<{ id: string; title: string; content: string }>> {
  try {
    // Perform semantic search
    const semanticResults = await semanticSearch(query, limit);

    // Perform keyword search using admin client to bypass RLS
    console.log(
      `Performing keyword search for query: "${query.substring(0, 30)}..."`
    );
    const { data: keywordResults, error } = await adminSupabase
      .from("documents")
      .select("id, title, content")
      .textSearch("content", query, {
        type: "plain",
        config: "english",
      })
      .limit(limit);

    console.log(
      `Found ${keywordResults?.length || 0} keyword matching documents`
    );
    if (error) {
      console.error("Error in keyword search:", error);
    }

    if (error) {
      console.error("Error in keyword search:", error);
      return semanticResults;
    }

    // Combine and deduplicate results
    const combinedResults = [...semanticResults];
    const semanticIds = new Set(semanticResults.map((doc) => doc.id));

    // Add keyword results that weren't in semantic results
    for (const doc of keywordResults || []) {
      if (!semanticIds.has(doc.id)) {
        combinedResults.push({
          ...doc,
          similarity: 0, // No similarity score for keyword results
        });
      }
    }

    // Limit to requested number
    return combinedResults.slice(0, limit);
  } catch (error) {
    console.error("Error in hybridSearch:", error);
    return [];
  }
}
