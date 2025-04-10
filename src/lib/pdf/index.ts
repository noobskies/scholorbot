import { supabase } from '@/lib/supabase';
import pdfParse from 'pdf-parse';

// Interface for document data
export interface DocumentData {
  title: string;
  content: string;
  source_file: string;
  file_type: string;
  metadata?: Record<string, any>;
}

/**
 * Process a PDF file and extract its content
 * @param buffer PDF file buffer
 * @returns Extracted text content and metadata
 */
export async function processPdf(buffer: Buffer): Promise<{
  content: string;
  metadata: Record<string, any>;
}> {
  try {
    const data = await pdfParse(buffer);
    
    return {
      content: data.text,
      metadata: {
        pageCount: data.numpages,
        info: data.info,
        metadata: data.metadata,
        version: data.version
      }
    };
  } catch (error) {
    console.error('Error extracting content from PDF:', error);
    throw new Error(`Failed to extract content from PDF: ${error}`);
  }
}

/**
 * Store document data in the database
 * @param documentData Document data to store
 * @returns ID of the created document record
 */
export async function storeDocument(documentData: DocumentData): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error storing document in database:', error);
      throw new Error(`Failed to store document: ${error.message}`);
    }
    
    return data.id;
  } catch (error) {
    console.error('Error storing document:', error);
    throw new Error(`Failed to store document: ${error}`);
  }
}

/**
 * Search for documents in the database
 * @param query Search query
 * @returns Array of matching documents
 */
export async function searchDocuments(query: string): Promise<any[]> {
  try {
    // Use full-text search
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, content')
      .textSearch('content', query, {
        type: 'plain',
        config: 'english'
      })
      .limit(5);
    
    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
}

/**
 * Get relevant document content for a specific query
 * @param query User query
 * @returns Relevant content from documents
 */
export async function getRelevantDocumentContent(query: string): Promise<string> {
  try {
    const documents = await searchDocuments(query);
    
    if (documents.length === 0) {
      return '';
    }
    
    // Extract relevant sections from the documents
    // This is a simple implementation - could be enhanced with more sophisticated NLP
    let relevantContent = '';
    
    for (const doc of documents) {
      // Add document title
      relevantContent += `From "${doc.title}":\n\n`;
      
      // Extract relevant paragraphs containing query terms
      const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 3);
      const paragraphs = doc.content.split('\n\n');
      
      const relevantParagraphs = paragraphs.filter(paragraph => {
        const paragraphLower = paragraph.toLowerCase();
        return queryTerms.some(term => paragraphLower.includes(term));
      }).slice(0, 3); // Limit to 3 most relevant paragraphs
      
      relevantContent += relevantParagraphs.join('\n\n') + '\n\n';
    }
    
    return relevantContent.trim();
  } catch (error) {
    console.error('Error getting relevant document content:', error);
    return '';
  }
}
