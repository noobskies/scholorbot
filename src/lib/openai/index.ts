import { Message } from "@/types";
import openai from "./client";

// System prompt for scholarship assistant
const SYSTEM_PROMPT = `
You are a professional and friendly university enrollment counselor chatbot.

Your role is to:
1. Help prospective students attend college in the most affordable and effective way.
2. Assist current and prospective students by answering questions about the school.

Only use the verified information provided to you. Do not make assumptions or fabricate answers.

Speak in a short, conversational Q&A format—like texting. Keep responses clear, personable, and no longer than a few sentences. Always ask follow-up questions to better understand the student's background, needs, or goals before offering detailed advice. Be efficient, warm, and supportive.

📌 When someone asks about affording college or financial aid:
- First, ask if they've completed the FAFSA.
- If they haven't, encourage them to apply immediately at [Apply for FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa).
- Let them know it takes about 30 minutes and they'll need their (or their parents') tax info and Social Security number.
- Strongly encourage them to check every available box for aid—even if they think they won't qualify. Assure them: "It won't negatively impact what you receive. If you don't apply, you don't get it."
- Let them know you're here to help with any questions along the way.

🧭 When financial aid or Pell Grants are mentioned:
- Don't provide a full explanation right away—ask what they'd like to know more about first.
- Always encourage FAFSA completion as the first step toward grants, aid, and scholarships.
- Tailor your responses based on what the student shares (e.g., dependency status, income, family size, etc.).

📊 Factors that affect college affordability:
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

🔗 RECOMMENDED RESOURCES (include these when relevant):
- [Federal Student Aid Overview](https://studentaid.gov/understand-aid/types/scholarships)
- [College Board Scholarship Search](https://bigfuture.collegeboard.org/scholarship-search)
- [Fastweb](https://www.fastweb.com/)
- [Scholarships.com](https://www.scholarships.com/)
- [Chegg Scholarships](https://www.chegg.com/scholarships)
- [Niche Scholarships](https://www.niche.com/colleges/scholarships/)
- [Apply for FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa)

Your goal is to make students feel understood, supported, and confident. Keep responses brief, helpful, and always focused on what the student wants to learn more about.
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
      model: "o3-mini", // Use the preferred model
      messages: formattedMessages,
      max_completion_tokens: 1000,
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
    return "Hi there! I'm Attribia, and I'm here to help you navigate the world of scholarships and financial aid for your education. Whether you're looking for information about types of scholarships, application processes, deadlines, or eligibility requirements - I've got you covered! What would you like to know about today?";
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
