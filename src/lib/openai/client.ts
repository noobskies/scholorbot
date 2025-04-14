import OpenAI from "openai";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Initialize OpenAI client with fallback for browser environment
let openai: OpenAI;

// In browser environments, we need to handle the API key differently
// as environment variables might not be accessible
if (!process.env.OPENAI_API_KEY && isBrowser) {
  console.warn(
    "OpenAI API key not found in environment variables. API calls will fail."
  );
  // Initialize with a placeholder that will be replaced server-side
  openai = new OpenAI({
    apiKey: "placeholder-key-for-browser",
    dangerouslyAllowBrowser: true,
  });
} else {
  // Server-side initialization
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export default openai;
