import OpenAI from "openai";
import { Message } from "@/types";

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

Remember to maintain a natural conversation flow while providing helpful scholarship information.
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
      "I'm having a bit of trouble coming up with a helpful response right now. Could you try rephrasing your question? I want to make sure I give you the best information possible!"
    );
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "I apologize, but I'm experiencing a technical hiccup right now. Could you try again in a few minutes? I'd really like to help you with your scholarship questions!";
  }
}

// Function to generate mock responses for development without an API key
function getMockResponse(messages: Message[]): string {
  const lastMessage = messages[messages.length - 1];
  const query = lastMessage?.content.toLowerCase() || "";

  if (query.includes("scholarship")) {
    return "Hi there! I'd be happy to help you find scholarships that match your interests and background. There are so many options out there - from merit-based awards to those focused on specific fields of study or personal backgrounds. What kinds of scholarships are you most interested in learning about? Are you looking for something based on academics, financial need, or perhaps related to a specific major?";
  } else if (query.includes("deadline")) {
    return "Great question about deadlines! Most scholarship application periods fall between December and March for the following academic year, but there are definitely opportunities with deadlines throughout the year. It's always smart to start early! What year are you planning to start college, or are you already enrolled? This will help me give you more specific timeline advice.";
  } else if (query.includes("apply") || query.includes("application")) {
    return "Applying for scholarships typically involves gathering several key components: your personal information, academic records, financial information if it's need-based, thoughtful essays, and often letters of recommendation. Each scholarship has its own specific requirements though! Are you working on a particular application right now that I can help you with? Or would you like some general tips for making your applications stand out?";
  } else if (query.includes("eligibility")) {
    return "Eligibility requirements really vary across different scholarships. Common criteria include things like academic achievement (GPA, test scores), financial need, field of study, extracurricular activities, and sometimes demographic factors or community involvement. Is there a specific type of eligibility requirement you're curious about? Or would you like me to help you find scholarships that might match your particular situation?";
  } else {
    return "Hi there! I'm ScholarBot, and I'm here to help you navigate the world of scholarships and financial aid for your education. Whether you're looking for information about types of scholarships, application processes, deadlines, or eligibility requirements - I've got you covered! What would you like to know about today?";
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
