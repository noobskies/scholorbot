import OpenAI from "openai";
import { Message } from "@/types";

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

export async function generateChatResponse(
  messages: Message[]
): Promise<string> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key is missing. Using mock response.");
      return getMockResponse(messages);
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Format messages for OpenAI API
    const formattedMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Use the latest model
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return (
      response.choices[0]?.message?.content ||
      "Sorry, I could not generate a response."
    );
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "Sorry, there was an error processing your request. Please try again later.";
  }
}

// Function to generate mock responses for development without an API key
function getMockResponse(messages: Message[]): string {
  const lastMessage = messages[messages.length - 1];
  const query = lastMessage?.content.toLowerCase() || "";

  if (query.includes("scholarship")) {
    return "I can help you find scholarships! There are many types available based on academic merit, financial need, specific fields of study, and more. What type of scholarships are you interested in?";
  } else if (query.includes("deadline")) {
    return "Most scholarship deadlines fall between December and March for the following academic year. However, there are scholarships with deadlines throughout the year. I recommend applying early!";
  } else if (query.includes("apply") || query.includes("application")) {
    return "To apply for scholarships, you typically need to prepare: personal information, academic records, financial information, essays, and letters of recommendation. Each scholarship has its own requirements, so be sure to read the instructions carefully.";
  } else if (query.includes("eligibility")) {
    return "Eligibility requirements vary by scholarship. Common criteria include academic achievement, financial need, field of study, extracurricular activities, and demographic factors. What specific eligibility questions do you have?";
  } else {
    return "I'm here to help you with scholarship information. You can ask me about types of scholarships, application processes, deadlines, eligibility requirements, and more!";
  }
}

// Function to extract scholarship queries from user messages
export function extractScholarshipQuery(userMessage: string): string {
  // This is a simple implementation - could be enhanced with more sophisticated NLP
  const lowerCaseMessage = userMessage.toLowerCase();

  if (
    lowerCaseMessage.includes("scholarship") ||
    lowerCaseMessage.includes("financial aid") ||
    lowerCaseMessage.includes("grant") ||
    lowerCaseMessage.includes("funding")
  ) {
    return userMessage;
  }

  return "";
}
