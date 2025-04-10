// Script to initialize the Supabase database with sample scholarship data
const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample scholarship data
const scholarships = [
  {
    name: "Academic Excellence Scholarship",
    description: "Awarded to students with outstanding academic achievements.",
    amount: "$5,000",
    deadline: "March 15, 2025",
    eligibility: "GPA of 3.8 or higher, SAT score of 1400+",
    applicationUrl: "https://example.com/academic-scholarship",
    organization: "National Education Foundation",
    tags: ["academic", "merit-based"],
  },
  {
    name: "STEM Innovation Scholarship",
    description: "For students pursuing degrees in Science, Technology, Engineering, or Mathematics.",
    amount: "$3,000",
    deadline: "April 30, 2025",
    eligibility: "Declared major in STEM field, GPA of 3.5+",
    applicationUrl: "https://example.com/stem-scholarship",
    organization: "Future Tech Foundation",
    tags: ["stem", "innovation"],
  },
  {
    name: "Community Service Scholarship",
    description: "Recognizes students who have made significant contributions to their communities.",
    amount: "$2,500",
    deadline: "February 28, 2025",
    eligibility: "100+ hours of documented community service",
    applicationUrl: "https://example.com/community-scholarship",
    organization: "Community Impact Alliance",
    tags: ["community-service", "leadership"],
  },
  {
    name: "First-Generation Student Scholarship",
    description: "Supports students who are the first in their family to attend college.",
    amount: "$4,000",
    deadline: "May 15, 2025",
    eligibility: "First-generation college student, demonstrated financial need",
    applicationUrl: "https://example.com/first-gen-scholarship",
    organization: "Educational Opportunity Foundation",
    tags: ["first-generation", "need-based"],
  },
  {
    name: "Diversity in Arts Scholarship",
    description: "Promotes diversity in the arts and supports students from underrepresented backgrounds.",
    amount: "$3,500",
    deadline: "March 31, 2025",
    eligibility: "Pursuing a degree in visual arts, performing arts, or creative writing",
    applicationUrl: "https://example.com/arts-scholarship",
    organization: "Creative Arts Alliance",
    tags: ["arts", "diversity"],
  },
];

// Function to create tables if they don't exist
async function createTables() {
  console.log('Creating tables if they don\'t exist...');

  try {
    // Create tables using the Supabase SQL API
    const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        query: `
          -- Create scholarships table
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

          -- Create chat_sessions table
          CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            created_at BIGINT,
            updated_at BIGINT
          );

          -- Create chat_messages table
          CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT NOT NULL,
            session_id TEXT REFERENCES chat_sessions(id),
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp BIGINT,
            PRIMARY KEY (id, session_id)
          );
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating tables:', errorText);
      return false;
    }

    console.log('Tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
}

// Function to insert sample scholarship data
async function insertScholarships() {
  console.log('Inserting sample scholarship data...');

  // Check if scholarships already exist
  const { data: existingData, error: checkError } = await supabase
    .from('scholarships')
    .select('id')
    .limit(1);

  if (checkError) {
    console.error('Error checking existing scholarships:', checkError);
    return false;
  }

  // If scholarships already exist, don't insert sample data
  if (existingData && existingData.length > 0) {
    console.log('Scholarships already exist, skipping sample data insertion');
    return true;
  }

  // Insert sample scholarships
  const { error: insertError } = await supabase
    .from('scholarships')
    .insert(scholarships);

  if (insertError) {
    console.error('Error inserting sample scholarships:', insertError);
    return false;
  }

  console.log('Sample scholarship data inserted successfully');
  return true;
}

// Main function to initialize the database
async function initializeDatabase() {
  console.log('Initializing database...');

  // Create tables
  const tablesCreated = await createTables();
  if (!tablesCreated) {
    console.error('Failed to create tables');
    process.exit(1);
  }

  // Insert sample data
  const dataInserted = await insertScholarships();
  if (!dataInserted) {
    console.error('Failed to insert sample data');
    process.exit(1);
  }

  console.log('Database initialization completed successfully');
  process.exit(0);
}

// Run the initialization
initializeDatabase().catch(error => {
  console.error('Unhandled error during database initialization:', error);
  process.exit(1);
});
