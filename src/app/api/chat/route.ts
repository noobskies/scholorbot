import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Message } from "@/types";

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

    // Format messages for OpenAI API
    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((msg: Message) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Use a stable model
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content =
      response.choices[0]?.message?.content ||
      "Sorry, I could not generate a response.";

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error in chat API:", error);

    // Provide more specific error messages
    let errorMessage =
      "Sorry, there was an error processing your request. Please try again later.";
    let statusCode = 500;

    if (error.status === 401) {
      errorMessage =
        "Authentication error with the AI service. Please check your API key.";
    } else if (error.status === 429) {
      errorMessage =
        "The AI service is currently experiencing high demand. Please try again later.";
    } else if (error.status === 400) {
      errorMessage =
        "There was an issue with the request format. Please try a different question.";
    }

    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        content: errorMessage,
      },
      { status: statusCode }
    );
  }
}
