-- Create the scholarships table
CREATE TABLE IF NOT EXISTS scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  amount TEXT,
  deadline TEXT,
  eligibility TEXT,
  "applicationUrl" TEXT,
  organization TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  created_at BIGINT,
  updated_at BIGINT
);

-- Create the chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT NOT NULL,
  session_id TEXT REFERENCES chat_sessions(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp BIGINT,
  PRIMARY KEY (id, session_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to scholarships
CREATE POLICY "Public can read scholarships"
ON scholarships
FOR SELECT
TO anon
USING (true);

-- Create policies for chat sessions and messages
-- These policies allow the client to create and read chat sessions and messages
CREATE POLICY "Clients can create chat sessions"
ON chat_sessions
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Clients can read their own chat sessions"
ON chat_sessions
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Clients can create chat messages"
ON chat_messages
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Clients can read chat messages"
ON chat_messages
FOR SELECT
TO anon
USING (true);
