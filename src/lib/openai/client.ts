import OpenAI from "openai";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Initialize OpenAI client with fallback for browser environment
let openai: OpenAI;

// In browser environments, we need to handle the API key differently
// as environment variables might not be accessible
if (isBrowser) {
  // For browser environments, always set dangerouslyAllowBrowser: true
  // The actual API calls will be made from the server-side API routes
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "placeholder-key-for-browser",
    dangerouslyAllowBrowser: true,
  });

  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      "OpenAI API key not found in environment variables. API calls will be handled by server-side routes."
    );
  }
} else {
  // Server-side initialization
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export default openai;
