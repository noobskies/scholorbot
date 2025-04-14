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

// User Profile Types
export interface UserProfile {
  dependencyStatus: string; // e.g., "Dependent", "Independent"
  taxFilingStatus: string; // e.g., "Single", "Married Filing Jointly", "Head of Household"
  adjustedGrossIncome: string; // Annual income
  familySize: string; // Number of family members
  stateOfResidence: string; // State where the student resides
  educationLevel?: string; // e.g., "high school", "undergraduate", "graduate"
  fieldOfStudy?: string; // e.g., "Computer Science", "Biology", "Business"
  interests?: string[]; // e.g., ["STEM", "Arts", "Community Service"]
  financialNeed?: boolean; // Whether the user has financial need
  demographics?: string[]; // Optional demographic information
  location?: string; // Optional location information
  gpa?: string; // Optional GPA information
  graduationYear?: string; // Optional graduation year
}

// Pre-Chat Question Types
export interface PreChatQuestion {
  id: string;
  question: string;
  type: "text" | "select" | "multiselect" | "boolean";
  options?: string[];
  required: boolean;
  fieldName: keyof UserProfile; // Maps to a field in UserProfile
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
  userProfile?: UserProfile; // Add user profile to session
}
