-- Drop existing policies
DROP POLICY IF EXISTS "Public can read documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;

-- Create policy for public read access to documents
CREATE POLICY "Public can read documents" 
ON documents
FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert documents
CREATE POLICY "Authenticated users can insert documents" 
ON documents
FOR INSERT 
WITH CHECK (true);

-- Create policy for authenticated users to update documents
CREATE POLICY "Authenticated users can update documents" 
ON documents
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to delete documents
CREATE POLICY "Authenticated users can delete documents" 
ON documents
FOR DELETE 
USING (true);
