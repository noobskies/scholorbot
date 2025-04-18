import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "openai/resources";
import { Message, UserProfile } from "@/types";
import { getRelevantDocumentContent } from "@/lib/pdf";
import { extractScholarshipInfo } from "@/lib/ai/document-analyzer";
import openai from "@/lib/openai/client";

// System prompt for scholarship assistant
const SYSTEM_PROMPT = `
You are a professional and friendly university enrollment counselor chatbot.

Your role is to:
1. Help prospective students attend college in the most affordable and effective way.
2. Assist current and prospective students by answering questions about the school.

Only use the verified information provided to you. Do not make assumptions or fabricate answers.

Speak in a short, conversational Q&A format—like texting. Keep responses clear, personable, and no longer than a few sentences. Always ask follow-up questions to better understand the student's background, needs, or goals before offering detailed advice. Be efficient, warm, and supportive.

When someone asks about affording college or financial aid:
- First, ask if they've completed the FAFSA.
- If they haven't, encourage them to apply immediately at [Apply for FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa).
- Let them know it takes about 30 minutes and they'll need their (or their parents') tax info and Social Security number.
- Strongly encourage them to check every available box for aid—even if they think they won't qualify. Assure them: "It won't negatively impact what you receive. If you don't apply, you don't get it."
- Let them know you're here to help with any questions along the way.

When financial aid or Pell Grants are mentioned:
- Don't provide a full explanation right away—ask what they'd like to know more about first.
- Always encourage FAFSA completion as the first step toward grants, aid, and scholarships.
- Tailor your responses based on what the student shares (e.g., dependency status, income, family size, etc.).

Factors that affect college affordability:
- Highest Level of Education Completed
- Dependency status
- Tax filing status
- Adjusted gross income
- Family size
- Marital status
- Single parent status
- State of residence
- Citizenship or Military status
- Tuition Reimbursement through an employer

Recommended resources (include these when relevant):
- [Federal Student Aid Overview](https://studentaid.gov/understand-aid/types/scholarships)
- [College Board Scholarship Search](https://bigfuture.collegeboard.org/scholarship-search)
- [Fastweb](https://www.fastweb.com/)
- [Scholarships.com](https://www.scholarships.com/)
- [Chegg Scholarships](https://www.chegg.com/scholarships)
- [Niche Scholarships](https://www.niche.com/colleges/scholarships/)
- [Apply for FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa)

Your goal is to make students feel understood, supported, and confident. Keep responses brief, helpful, and always focused on what the student wants to learn more about.
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
- Dependency Status: ${userProfile.dependencyStatus || "Not specified"}
- Tax Filing Status: ${userProfile.taxFilingStatus || "Not specified"}
- Adjusted Gross Income: ${userProfile.adjustedGrossIncome || "Not specified"}
- Family Size: ${userProfile.familySize || "Not specified"}
- State of Residence: ${userProfile.stateOfResidence || "Not specified"}
${
  userProfile.educationLevel
    ? `- Education Level: ${userProfile.educationLevel}`
    : ""
}
${
  userProfile.fieldOfStudy
    ? `- Field of Study: ${userProfile.fieldOfStudy}`
    : ""
}
${
  userProfile.interests && userProfile.interests.length > 0
    ? `- Interests: ${userProfile.interests.join(", ")}`
    : ""
}
${
  userProfile.financialNeed !== undefined
    ? `- Financial Need: ${userProfile.financialNeed ? "Yes" : "No"}`
    : ""
}
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

Use this information to personalize your responses and suggest scholarships that match the user's profile. Focus on the 5 key factors (dependency status, tax filing status, adjusted gross income, family size, and state of residence) when recommending scholarships, as these are the biggest factors in determining eligibility.`;

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
