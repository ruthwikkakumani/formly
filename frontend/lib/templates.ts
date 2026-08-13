import { DEFAULT_THEME } from "./constants";
import { Question, QuestionType } from "./types";

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  accent: string;
  questions: Question[];
}

function question(
  type: QuestionType,
  title: string,
  extras: Partial<Pick<Question, "description" | "required" | "options">> = {},
): Question {
  return {
    type,
    title,
    description: extras.description || "",
    required: extras.required ?? false,
    options: extras.options || [],
    logic: {},
  };
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "product-feedback",
    title: "Product feedback",
    description: "See what people love, what is stuck, and where to follow up.",
    accent: "#6558f5",
    questions: [
      question("rating", "How would you rate this product overall?", { required: true }),
      question("multiple_choice", "What best describes you?", {
        required: true,
        options: ["Customer", "Trial user", "Teammate", "Just exploring"],
      }),
      question("long_text", "What could we improve?", {
        description: "The more specific, the more useful.",
      }),
      question("email", "Where can we follow up?", { required: true }),
    ],
  },
  {
    id: "customer-interview",
    title: "Customer interview",
    description: "A discovery script for first conversations with customers.",
    accent: "#0445af",
    questions: [
      question("short_text", "Who are we speaking with?", { required: true }),
      question("short_text", "What company are you with?"),
      question("dropdown", "What is your role?", {
        required: true,
        options: ["Founder", "Product", "Engineering", "Operations", "Other"],
      }),
      question("multiple_choice", "What are you trying to get done today?", {
        required: true,
        options: ["Save time", "Grow revenue", "Reduce risk", "Replace a tool", "Something else"],
      }),
      question("long_text", "Walk us through the last time this was painful."),
      question("yes_no", "Would you be open to a follow-up call?", { required: true }),
      question("email", "Best email to reach you"),
    ],
  },
  {
    id: "event-rsvp",
    title: "Event RSVP",
    description: "Collect attendance, session picks, and guest details.",
    accent: "#e85d04",
    questions: [
      question("yes_no", "Will you be joining us?", { required: true }),
      question("dropdown", "Which session are you most interested in?", {
        required: true,
        options: ["Morning keynote", "Product workshop", "Office hours", "Not sure yet"],
      }),
      question("short_text", "What name should we put on your badge?", { required: true }),
      question("email", "Where should we send the calendar invite?", { required: true }),
      question("number", "How many guests are you bringing?"),
    ],
  },
  {
    id: "remote-work-pulse",
    title: "Remote work pulse",
    description: "A weekly check-in for distributed teams.",
    accent: "#0d9488",
    questions: [
      question("rating", "How is your week going so far?", { required: true }),
      question("dropdown", "Where are you working from this week?", {
        required: true,
        options: ["Home", "Office", "Coworking", "Traveling"],
      }),
      question("multiple_choice", "What is blocking you most right now?", {
        options: ["Meetings", "Unclear priorities", "Tools", "Focus time", "Nothing major"],
      }),
      question("yes_no", "Do you have what you need to do your best work?", { required: true }),
      question("long_text", "Anything your manager should know?"),
    ],
  },
  {
    id: "nps-satisfaction",
    title: "NPS & satisfaction",
    description: "Measure loyalty, then ask what would make it a 5.",
    accent: "#c2410c",
    questions: [
      question("rating", "How likely are you to recommend us to a friend?", { required: true }),
      question("multiple_choice", "What influenced your score the most?", {
        required: true,
        options: ["Product quality", "Support", "Price", "Ease of use", "Something else"],
      }),
      question("long_text", "What could we do to earn a 5?"),
      question("email", "Optional — leave an email if we may follow up"),
    ],
  },
  {
    id: "contact-lead",
    title: "Contact & leads",
    description: "A short intake form for new conversations.",
    accent: "#191919",
    questions: [
      question("short_text", "What's your name?", { required: true }),
      question("email", "What's the best email to reach you?", { required: true }),
      question("dropdown", "What can we help with?", {
        required: true,
        options: ["Sales", "Support", "Partnerships", "Press", "Something else"],
      }),
      question("short_text", "Company or website"),
      question("long_text", "Tell us a bit more about what you need."),
    ],
  },
];

export function templateCreatePayload(
  template: FormTemplate,
  actor: { actor_name: string; actor_email: string },
) {
  return {
    title: template.title,
    description: template.description,
    questions: template.questions,
    theme: { ...DEFAULT_THEME, accent: template.accent },
    ...actor,
  };
}
