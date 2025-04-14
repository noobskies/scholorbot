import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { Message, UserProfile } from "@/types";
import { getRelevantDocumentContent } from "@/lib/pdf";
import { extractScholarshipInfo } from "@/lib/ai/document-analyzer";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for scholarship assistant
const SYSTEM_PROMPT = `
You are a friendly, conversational scholarship assistant embedded on a school website. Your name is ScholarBot.
Your goal is to help students find scholarships through natural, engaging conversations.

CONVERSATION STYLE:
- Be warm, approachable, and encouraging - like a helpful guidance counselor
- Use a question-answer conversational style that feels natural and engaging
- Ask clarifying questions to better understand the student's needs and situation
- Keep responses concise (2-3 paragraphs max) unless detailed information is requested
- Use a friendly, slightly casual tone while maintaining professionalism
- End your responses with a relevant follow-up question to keep the conversation flowing
- Personalize responses based on what you learn about the student's interests and needs

SCHOLARSHIP GUIDANCE:
- When discussing scholarships, highlight eligibility criteria, award amounts, deadlines, and application processes
- If you don't know specific scholarship details, suggest relevant categories and ask what interests them most
- Recommend reliable scholarship search resources when appropriate
- Include direct links to scholarship websites or application pages using Markdown format: [Scholarship Name](URL)
- Format scholarship lists with bullet points for readability
- Provide actionable next steps and encourage timely applications
- Respect privacy (FERPA) - don't ask for or store personally identifiable information
- When citing information from documents, mention the document title as a reference
- For follow-up questions about specific documents, provide more detailed information

SCHOLARSHIP CATEGORIES TO SUGGEST (when relevant to the conversation):
- Merit-based scholarships (academic achievement, leadership)
- Need-based scholarships (financial need)
- Identity-based scholarships (ethnicity, gender, religion)
- Field of study scholarships (STEM, arts, business)
- Athletic scholarships
- Community service scholarships
- Essay contest scholarships
- First-generation student scholarships
- Military/veteran scholarships
- Employer/professional organization scholarships

RECOMMENDED SCHOLARSHIP RESOURCES (include links to these when relevant):
- [Federal Student Aid](https://studentaid.gov/understand-aid/types/scholarships)
- [College Board Scholarship Search](https://bigfuture.collegeboard.org/scholarship-search)
- [Fastweb](https://www.fastweb.com/)
- [Scholarships.com](https://www.scholarships.com/)
- [Chegg Scholarships](https://www.chegg.com/scholarships)
- [Niche Scholarships](https://www.niche.com/colleges/scholarships/)
- [Bold.org](https://bold.org/)
- [Cappex](https://www.cappex.com/)

Remember to maintain a natural conversation flow while providing helpful scholarship information.
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
            "Oops! I'm having trouble connecting to my brain right now. Please let your school administrator know that I need a little technical help to get back up and running properly.",
        },
        { status: 500 }
      );
    }

    const { messages, userProfile } = (await request.json()) as {
      messages: Message[];
      userProfile?: UserProfile;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        {
          error: "Invalid request: messages array is required",
          content:
            "I didn't quite catch that. Could you please try asking your question again in a different way? I'm here to help!",
        },
        { status: 400 }
      );
    }

    // Get the user's latest message
    const userMessage = messages[messages.length - 1];

    // Only search for relevant documents if this is a user message
    let relevantDocumentContent = "";
    const documentIds: string[] = [];

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

    // Add user profile information if available
    if (userProfile) {
      const profilePrompt = `
USER PROFILE INFORMATION:
- Education Level: ${userProfile.educationLevel}
- Field of Study: ${userProfile.fieldOfStudy}
- Interests: ${userProfile.interests.join(", ")}
- Financial Need: ${userProfile.financialNeed ? "Yes" : "No"}
${
  userProfile.graduationYear
    ? `- Expected Graduation: ${userProfile.graduationYear}`
    : ""
}
${userProfile.gpa ? `- GPA: ${userProfile.gpa}` : ""}
${userProfile.location ? `- Location: ${userProfile.location}` : ""}
${
  userProfile.demographics && userProfile.demographics.length > 0
    ? `- Demographics: ${userProfile.demographics.join(", ")}`
    : ""
}

Use this information to personalize your responses and suggest scholarships that match the user's profile. Focus on their education level, field of study, and specific interests when recommending scholarships.`;

      formattedMessages.push({
        role: "system",
        content: profilePrompt,
      });
    }

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
          "I'm having a bit of trouble coming up with a helpful response right now. Could you try rephrasing your question? I want to make sure I give you the best information possible!",
      });
    } catch (apiError: unknown) {
      // Using unknown type for catch clause
      console.error("OpenAI API error:", apiError);

      // Try again with a smaller context if we get a context length error
      const error = apiError as { code?: string; message?: string };
      if (error.code === "context_length_exceeded") {
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
              "I found quite a lot of information about your question! To help you better, could you ask something more specific? For example, you might ask about a particular scholarship program or eligibility requirement you're interested in.",
          });
        } catch (fallbackError) {
          console.error("Error in fallback API call:", fallbackError);
          return NextResponse.json(
            {
              content:
                "Wow, there's a ton of information available about that topic! To give you the most helpful answer, could you narrow down your question a bit? Maybe focus on a specific aspect you're most interested in learning about.",
            },
            { status: 413 }
          );
        }
      }

      // Handle other API errors
      const errorObj = apiError as { message?: string };
      return NextResponse.json(
        {
          error: errorObj.message || "OpenAI API error",
          content:
            "I seem to be having a little trouble processing that request right now. Could you try asking your question in a different way? I'm eager to help you find the scholarship information you need!",
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error in chat API:", error);

    // Provide more specific error messages
    let errorMessage =
      "I apologize, but I'm experiencing a technical hiccup right now. Could you try again in a few minutes? I'd really like to help you with your scholarship questions!";
    const statusCode = 500;

    // Type guard for OpenAI API errors
    if (typeof error === "object" && error !== null) {
      const apiError = error as { status?: number; message?: string };

      if (apiError.status === 401) {
        errorMessage =
          "I'm having trouble accessing my knowledge database right now. This is a technical issue that your school administrator needs to fix. Please let them know I need help!";
      } else if (apiError.status === 429) {
        errorMessage =
          "It looks like a lot of students are asking me questions right now! Could you try again in a few minutes when things quiet down a bit? I'll be here ready to help with your scholarship questions.";
      } else if (apiError.status === 400) {
        errorMessage =
          "I'm having trouble understanding that question format. Could you try asking in a different way? Maybe use simpler language or break your question into smaller parts?";
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
