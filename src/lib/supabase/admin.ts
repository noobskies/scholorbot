import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./index";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Create a Supabase client with the service role key for admin operations
// This bypasses RLS policies
let adminSupabase: SupabaseClient;

// In browser environments, we should always use the regular client
if (isBrowser) {
  console.warn("Using regular Supabase client in browser environment");
  adminSupabase = supabase;
} else {
  // Server-side initialization
  adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : supabase; // Fall back to regular client if service role key is not available
}

export default adminSupabase;
