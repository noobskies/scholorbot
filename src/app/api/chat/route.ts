import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { Message } from "@/types";
import { getRelevantDocumentContent } from "@/lib/pdf";
import { extractScholarshipInfo } from "@/lib/ai/document-analyzer";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for scholarship assistant
const SYSTEM_PROMPT = `
You are a helpful scholarship assistant embedded on a school website.
Your goal is to help students find scholarships that match their profile and needs.

GUIDELINES:
1. Provide concise, accurate information about scholarships.
2. Be friendly, supportive, and encouraging to students seeking financial aid.
3. Respect FERPA regulations and do not ask for or store personally identifiable information.
4. When discussing scholarships, mention key details like eligibility criteria, award amounts, deadlines, and application processes.
5. If you don't know specific scholarship details, suggest general categories of scholarships that might be relevant.
6. Recommend reliable scholarship search resources when appropriate.
7. Format your responses with clear sections and bullet points when listing multiple items.
8. Provide actionable next steps for students whenever possible.
9. Be mindful of application deadlines and suggest timelines for scholarship applications.
10. Encourage students to check with their school's financial aid office for additional opportunities.
11. When citing information from documents, include the document title as a reference.
12. If the user asks follow-up questions about specific documents, provide more details from those sources.

SCHOLARSHIP CATEGORIES TO SUGGEST:
- Merit-based scholarships (academic achievement, leadership, etc.)
- Need-based scholarships (financial need)
- Identity-based scholarships (ethnicity, gender, religion, etc.)
- Field of study scholarships (STEM, arts, business, etc.)
- Athletic scholarships
- Community service scholarships
- Essay contest scholarships
- First-generation student scholarships
- Military/veteran scholarships
- Employer/professional organization scholarships

When asked about specific scholarships, provide information about eligibility, award amounts, deadlines, and application processes if available.
`;

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing");
      return NextResponse.json(
        {
          error: "OpenAI API key is missing",
          content:
            "Sorry, the chatbot is not properly configured. Please contact the administrator.",
        },
        { status: 500 }
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        {
          error: "Invalid request: messages array is required",
          content: "Sorry, I could not process your request. Please try again.",
        },
        { status: 400 }
      );
    }

    // Get the user's latest message
    const userMessage = messages[messages.length - 1];

    // Only search for relevant documents if this is a user message
    let relevantDocumentContent = "";
    let documentIds: string[] = [];

    if (userMessage && userMessage.role === "user") {
      console.log("Chat query:", userMessage.content);

      // Search for relevant document content based on the user's query
      try {
        console.log("Searching for relevant documents...");
        relevantDocumentContent = await getRelevantDocumentContent(
          userMessage.content
        );
        console.log(
          "Document search complete. Content length:",
          relevantDocumentContent.length
        );

        // Extract document IDs from the content for potential follow-up
        const docIdRegex = /Document ID: ([a-f0-9-]+)/g;
        let match;
        while ((match = docIdRegex.exec(relevantDocumentContent)) !== null) {
          documentIds.push(match[1]);
        }

        console.log("Found document IDs:", documentIds);
      } catch (searchError) {
        console.error("Error searching for relevant documents:", searchError);
      }
    }

    // Format messages for OpenAI API
    const formattedMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add relevant document content if available
    if (relevantDocumentContent) {
      // Check if we should extract structured information for specific document queries
      const isSpecificDocumentQuery =
        (userMessage.content.toLowerCase().includes("scholarship details") ||
          userMessage.content.toLowerCase().includes("tell me more about") ||
          userMessage.content.toLowerCase().includes("specific requirements") ||
          userMessage.content.toLowerCase().includes("how do i apply") ||
          userMessage.content.toLowerCase().includes("eligibility criteria")) &&
        documentIds.length > 0;

      // If this is a specific query about a document, try to extract structured info
      if (isSpecificDocumentQuery) {
        try {
          // Get the first document ID (most relevant)
          const primaryDocId = documentIds[0];

          // Try to extract structured scholarship info
          const scholarshipInfo = await extractScholarshipInfo(primaryDocId);

          if (scholarshipInfo) {
            // Add structured info to the context
            formattedMessages.push({
              role: "system",
              content: `Here is detailed information about the scholarship the user is asking about:\n\n${JSON.stringify(
                scholarshipInfo,
                null,
                2
              )}\n\nPlease use this structured information to provide a comprehensive and well-organized response to the user's question.`,
            });
          }
        } catch (extractError) {
          console.warn(
            "Failed to extract structured scholarship info:",
            extractError
          );
          // Continue with regular document content if extraction fails
        }
      }

      // Always include the relevant document content
      formattedMessages.push({
        role: "system",
        content: `Here is some relevant information about scholarships that might help answer the user's question:\n\n${relevantDocumentContent}\n\nPlease use this information to provide a helpful response to the user. When referencing specific information, mention the document it came from.`,
      });
    }

    // Add the conversation history
    formattedMessages.push(
      ...messages.map((msg: Message) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }))
    );

    // Call OpenAI API with a more capable model for complex scholarship questions
    try {
      console.log(`Sending ${formattedMessages.length} messages to OpenAI API`);

      if (formattedMessages.length > 0 && formattedMessages[0].content) {
        console.log(
          `System prompt length: ${formattedMessages[0].content.length} chars`
        );
      }

      if (
        formattedMessages.length > 1 &&
        formattedMessages[1].role === "system" &&
        formattedMessages[1].content
      ) {
        console.log(
          `Document content length: ${formattedMessages[1].content.length} chars`
        );
      }

      const response = await openai.chat.completions.create({
        model: "o3-mini", // Use a model with larger context window
        messages: formattedMessages,
        max_completion_tokens: 1000,
      });

      console.log("OpenAI API response received successfully");
      return NextResponse.json({
        content:
          response.choices[0]?.message?.content ||
          "Sorry, I could not generate a response.",
      });
    } catch (apiError: any) {
      // Using any type for simplicity
      console.error("OpenAI API error:", apiError);

      // Try again with a smaller context if we get a context length error
      if (apiError.code === "context_length_exceeded") {
        console.log(
          "Context length exceeded, retrying with reduced context..."
        );

        try {
          // Keep only the system prompt and the user's messages
          const reducedMessages = [
            formattedMessages[0], // System prompt
            ...formattedMessages.filter(
              (msg) => msg.role === "user" || msg.role === "assistant"
            ),
          ];

          const fallbackResponse = await openai.chat.completions.create({
            model: "o3-mini", // Use the same model but with reduced context
            messages: reducedMessages,
            max_completion_tokens: 1000,
          });

          return NextResponse.json({
            content:
              fallbackResponse.choices[0]?.message?.content ||
              "I found information about your query, but it was too extensive to process fully. Please ask a more specific question about the 2024-25 Undergraduate Catalog.",
          });
        } catch (fallbackError) {
          console.error("Error in fallback API call:", fallbackError);
          return NextResponse.json(
            {
              content:
                "I found information about your query, but it was too extensive to process. Please ask a more specific question about the 2024-25 Undergraduate Catalog.",
            },
            { status: 413 }
          );
        }
      }

      // Handle other API errors
      return NextResponse.json(
        {
          error: apiError.message || "OpenAI API error",
          content:
            "Sorry, I encountered an error while processing your request. Please try again with a more specific question.",
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error in chat API:", error);

    // Provide more specific error messages
    let errorMessage =
      "Sorry, there was an error processing your request. Please try again later.";
    const statusCode = 500;

    // Type guard for OpenAI API errors
    if (typeof error === "object" && error !== null) {
      const apiError = error as { status?: number; message?: string };

      if (apiError.status === 401) {
        errorMessage =
          "Authentication error with the AI service. Please check your API key.";
      } else if (apiError.status === 429) {
        errorMessage =
          "The AI service is currently experiencing high demand. Please try again later.";
      } else if (apiError.status === 400) {
        errorMessage =
          "There was an issue with the request format. Please try a different question.";
      }

      return NextResponse.json(
        {
          error: apiError.message || "Internal server error",
          content: errorMessage,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        content: errorMessage,
      },
      { status: statusCode }
    );
  }
}
