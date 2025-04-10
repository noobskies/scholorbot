import { createClient } from "@supabase/supabase-js";
import { Scholarship, ChatSession, Message } from "@/types";

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Scholarship data functions
export async function getScholarships(query?: string): Promise<Scholarship[]> {
  try {
    let supabaseQuery = supabase.from("scholarships").select("*");

    // Apply text search if query is provided
    if (query) {
      supabaseQuery = supabaseQuery.textSearch("description", query);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching scholarships:", error);
    return [];
  }
}

// Chat session functions
export async function createChatSession(): Promise<string> {
  try {
    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();

    const { error } = await supabase.from("chat_sessions").insert({
      id: sessionId,
      created_at: timestamp,
      updated_at: timestamp,
    });

    if (error) throw error;

    return sessionId;
  } catch (error) {
    console.error("Error creating chat session:", error);
    // Return a client-side generated ID as fallback
    return `local-${crypto.randomUUID()}`;
  }
}

export async function saveChatMessage(
  sessionId: string,
  message: Message
): Promise<void> {
  try {
    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error saving chat message:", error);
    // Silently fail - messages will still be in local state
  }
}

export async function getChatSession(
  sessionId: string
): Promise<ChatSession | null> {
  try {
    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Get messages
    const { data: messagesData, error: messagesError } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true });

    if (messagesError) throw messagesError;

    return {
      id: sessionData.id,
      messages: messagesData || [],
      createdAt: sessionData.created_at,
      updatedAt: sessionData.updated_at,
    };
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return null;
  }
}
