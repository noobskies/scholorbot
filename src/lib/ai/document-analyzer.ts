import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interface for scholarship information
export interface ScholarshipInfo {
  name: string;
  description: string;
  eligibility: string[];
  amount: string;
  deadline: string;
  application_process: string;
  contact_info: string;
  website?: string;
  additional_info?: string;
}

/**
 * Generate a summary of a document using AI
 * @param documentId ID of the document to summarize
 * @returns Summary text
 */
export async function generateDocumentSummary(
  documentId: string
): Promise<string> {
  try {
    // Fetch the document
    const { data: document, error } = await supabase
      .from("documents")
      .select("title, content")
      .eq("id", documentId)
      .single();

    if (error || !document) {
      console.error("Error fetching document for summary:", error);
      throw new Error(`Document not found: ${documentId}`);
    }

    // Truncate content to fit within token limits
    const truncatedContent = document.content.slice(0, 12000);

    // Generate summary using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that summarizes scholarship documents. Create a concise summary that captures the key information about the scholarship, including eligibility criteria, award amount, deadlines, and application process.",
        },
        {
          role: "user",
          content: `Please summarize the following scholarship document titled "${document.title}":\n\n${truncatedContent}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const summary =
      response.choices[0]?.message?.content || "No summary generated.";

    // Store the summary in the database
    await supabase
      .from("documents")
      .update({
        metadata: {
          summary,
          summarized_at: new Date().toISOString(),
        },
      })
      .eq("id", documentId);

    return summary;
  } catch (error) {
    console.error("Error generating document summary:", error);
    return "Failed to generate summary.";
  }
}

/**
 * Extract structured scholarship information from a document using AI
 * @param documentId ID of the document to analyze
 * @returns Structured scholarship information
 */
export async function extractScholarshipInfo(
  documentId: string
): Promise<ScholarshipInfo | null> {
  try {
    // Fetch the document
    const { data: document, error } = await supabase
      .from("documents")
      .select("title, content, metadata")
      .eq("id", documentId)
      .single();

    if (error || !document) {
      console.error("Error fetching document for extraction:", error);
      throw new Error(`Document not found: ${documentId}`);
    }

    // Truncate content to fit within token limits
    const truncatedContent = document.content.slice(0, 12000);

    // Extract information using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that extracts structured information about scholarships from documents.
Extract the following information:
1. Scholarship name
2. Description
3. Eligibility criteria (as a list)
4. Award amount
5. Application deadline
6. Application process
7. Contact information
8. Website (if available)
9. Any additional important information

Format your response as a valid JSON object with these fields:
{
  "name": "Scholarship name",
  "description": "Brief description",
  "eligibility": ["criterion 1", "criterion 2", ...],
  "amount": "Award amount",
  "deadline": "Application deadline",
  "application_process": "How to apply",
  "contact_info": "Contact information",
  "website": "Website URL if available",
  "additional_info": "Any other important details"
}`,
        },
        {
          role: "user",
          content: `Please extract structured scholarship information from the following document titled "${document.title}":\n\n${truncatedContent}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const extractedInfo = response.choices[0]?.message?.content;

    if (!extractedInfo) {
      return null;
    }

    try {
      const scholarshipInfo = JSON.parse(extractedInfo) as ScholarshipInfo;

      // Store the extracted information in the database
      await supabase
        .from("documents")
        .update({
          metadata: {
            ...document.metadata,
            scholarship_info: scholarshipInfo,
            extracted_at: new Date().toISOString(),
          },
        })
        .eq("id", documentId);

      return scholarshipInfo;
    } catch (parseError) {
      console.error("Error parsing extracted scholarship info:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Error extracting scholarship info:", error);
    return null;
  }
}

/**
 * Generate follow-up questions based on a user query and document content
 * @param query User's original query
 * @param documentContent Content from relevant documents
 * @returns Array of suggested follow-up questions
 */
export async function generateFollowUpQuestions(
  query: string,
  documentContent: string
): Promise<string[]> {
  try {
    // Truncate content to fit within token limits
    const truncatedContent = documentContent.slice(0, 8000);

    // Generate follow-up questions using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that helps students find scholarship information. Based on the user's query and the retrieved document content, suggest 3 relevant follow-up questions that would help the student get more specific information about scholarships they might be eligible for.",
        },
        {
          role: "user",
          content: `User query: "${query}"\n\nRelevant document content:\n${truncatedContent}\n\nSuggest 3 follow-up questions that would help the student get more specific information.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    const suggestedQuestions = response.choices[0]?.message?.content || "";

    // Extract questions from the response
    const questions = suggestedQuestions
      .split(/\d+\.\s+/)
      .filter((q) => q.trim().length > 0 && q.trim().endsWith("?"))
      .map((q) => q.trim());

    return questions.length > 0
      ? questions
      : [
          "What specific eligibility requirements should I meet?",
          "When is the application deadline?",
          "How can I apply for this scholarship?",
        ];
  } catch (error) {
    console.error("Error generating follow-up questions:", error);
    return [];
  }
}
