-- Fix RLS policies for document_chunks table

-- First, drop the existing policy
DROP POLICY IF EXISTS "Public can read document_chunks" ON document_chunks;

-- Create policy for public read access to document_chunks
CREATE POLICY "Public can read document_chunks"
ON document_chunks
FOR SELECT
TO anon
USING (true);

-- Create policy for service role to insert into document_chunks
CREATE POLICY "Service role can insert document_chunks"
ON document_chunks
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create policy for service role to update document_chunks
CREATE POLICY "Service role can update document_chunks"
ON document_chunks
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for service role to delete document_chunks
CREATE POLICY "Service role can delete document_chunks"
ON document_chunks
FOR DELETE
TO service_role
USING (true);

-- Create policy for authenticated users to insert into document_chunks
CREATE POLICY "Authenticated users can insert document_chunks"
ON document_chunks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update document_chunks
CREATE POLICY "Authenticated users can update document_chunks"
ON document_chunks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to delete document_chunks
CREATE POLICY "Authenticated users can delete document_chunks"
ON document_chunks
FOR DELETE
TO authenticated
USING (true);

-- Create policy for postgres user to manage document_chunks
CREATE POLICY "Postgres user can manage document_chunks"
ON document_chunks
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);
