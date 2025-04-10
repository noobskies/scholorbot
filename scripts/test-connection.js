// Script to test the connection to Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  
  try {
    // Test query to get scholarships
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error querying scholarships:', error);
      process.exit(1);
    }
    
    console.log('Successfully connected to Supabase!');
    console.log(`Retrieved ${data.length} scholarships:`);
    console.log(JSON.stringify(data, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Unhandled error during connection test:', error);
    process.exit(1);
  }
}

// Run the test
testConnection();
