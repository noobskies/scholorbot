# AI-Enhanced Scholarship Chatbot

This document explains how to set up and use the AI-enhanced features of the scholarship chatbot, which now includes advanced document processing, semantic search, and intelligent responses.

## Overview

The scholarship chatbot has been enhanced with several AI capabilities:

1. **Semantic Search**: Uses OpenAI embeddings to find relevant content based on meaning, not just keywords
2. **Document Chunking**: Breaks documents into smaller pieces for more precise retrieval
3. **Structured Information Extraction**: Automatically extracts scholarship details like eligibility criteria and deadlines
4. **Follow-up Question Generation**: Suggests relevant follow-up questions to users
5. **Document Summarization**: Creates concise summaries of scholarship documents

## Setup Instructions

### 1. Database Setup

First, you need to update your Supabase database to support vector search:

1. Run the SQL script to enable pgvector and create necessary tables:

```bash
psql -h your-supabase-host -d postgres -U postgres -f scripts/update-database-for-ai.sql
```

Or execute the SQL commands in the Supabase SQL Editor.

### 2. Environment Variables

Ensure your `.env.local` file has the following variables:

```
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

Make sure you have all required dependencies:

```bash
npm install openai @supabase/supabase-js uuid
```

## Using AI-Enhanced Features

### Processing PDFs with AI

When uploading a PDF, use the enhanced processor:

```typescript
import { processAndEnhancePdf } from "@/lib/ai/pdf-processor";

// Process a PDF file with AI enhancements
const result = await processAndEnhancePdf(
  pdfBuffer,
  "scholarship-document.pdf",
  "global" // or "school-specific"
);

console.log(`Document ID: ${result.documentId}`);
console.log(`Summary: ${result.summary}`);
console.log(`Chunks created: ${result.chunkCount}`);
```

### Semantic Search

The chatbot now automatically uses semantic search when available. If you want to use it directly:

```typescript
import { hybridSearch } from "@/lib/ai/embeddings";

// Search for documents semantically
const results = await hybridSearch("engineering scholarships for women");
```

### Document Analysis

Extract structured information from scholarship documents:

```typescript
import { extractScholarshipInfo } from "@/lib/ai/document-analyzer";

// Extract structured information
const scholarshipInfo = await extractScholarshipInfo(documentId);

if (scholarshipInfo) {
  console.log(`Scholarship Name: ${scholarshipInfo.name}`);
  console.log(`Deadline: ${scholarshipInfo.deadline}`);
  console.log(`Eligibility: ${scholarshipInfo.eligibility.join(", ")}`);
}
```

## How It Works

### Document Processing Flow

1. **PDF Upload**: When a PDF is uploaded, it's processed to extract text
2. **Embedding Generation**: The document text is sent to OpenAI to generate embeddings
3. **Document Chunking**: The document is split into smaller chunks for better retrieval
4. **Information Extraction**: AI extracts structured information about scholarships
5. **Storage**: All information is stored in the database for future retrieval

### Chat Integration

When a user asks a question:

1. The system searches for relevant document chunks using semantic search
2. It extracts the most relevant information from those chunks
3. For specific scholarship queries, it retrieves structured information
4. The relevant information is sent to the OpenAI API along with the user's question
5. The AI generates a response based on the document content and conversation history
6. Follow-up questions are suggested to help users get more information

## Troubleshooting

### Vector Search Not Working

If vector search isn't working:

1. Verify the pgvector extension is enabled in Supabase
2. Check that documents have embeddings stored
3. Ensure the match_documents function is properly created

### OpenAI API Errors

If you encounter OpenAI API errors:

1. Verify your API key is correct
2. Check for rate limiting issues
3. Ensure your requests are within token limits

## Future Enhancements

Potential future improvements:

1. **Fine-tuned Models**: Train custom models on scholarship data
2. **Multi-modal Support**: Process images and diagrams in PDFs
3. **User Personalization**: Tailor responses based on user profiles
4. **Automated Updates**: Regularly check for scholarship deadline updates
