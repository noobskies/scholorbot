// Message Types
export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

// Scholarship Types
export interface Scholarship {
  id: string;
  name: string;
  description: string;
  amount: string;
  deadline: string;
  eligibility: string;
  applicationUrl: string;
  organization: string;
  tags: string[];
}

// Chat Widget Types
export interface ChatWidgetProps {
  title?: string;
  subtitle?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initialMessage?: string;
}

// Session Types
export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
