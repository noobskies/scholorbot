-- Create the documents table to store extracted PDF data
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_file TEXT NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'school-specific', -- 'global' or 'school-specific'
  source TEXT, -- e.g., 'federal', 'state', 'school'
  is_active BOOLEAN DEFAULT true, -- to enable/disable documents without deleting
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a vector column for semantic search (if using pgvector extension)
-- Uncomment if you have pgvector installed in your Supabase project
-- ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to documents
CREATE POLICY "Public can read documents"
ON documents
FOR SELECT
TO anon
USING (true);

-- Create full-text search index for better performance
CREATE INDEX IF NOT EXISTS documents_content_idx ON documents USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS documents_title_idx ON documents USING GIN (to_tsvector('english', title));
