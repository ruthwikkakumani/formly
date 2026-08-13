import { Question, QuestionType } from "./types";

export const QUESTION_TYPES: Array<{ value: QuestionType; label: string; icon: string }> = [
  { value: "short_text", label: "Short text", icon: "Aa" },
  { value: "long_text", label: "Long text", icon: "¶" },
  { value: "multiple_choice", label: "Multiple choice", icon: "☰" },
  { value: "dropdown", label: "Dropdown", icon: "▾" },
  { value: "email", label: "Email", icon: "@" },
  { value: "number", label: "Number", icon: "#" },
  { value: "yes_no", label: "Yes / No", icon: "Y" },
  { value: "rating", label: "Rating", icon: "★" },
  { value: "file_upload", label: "File upload", icon: "↑" },
  { value: "payment", label: "Payment", icon: "$" },
];

export const THEME_FONTS = [
  "DM Sans",
  "Inter",
  "Plus Jakarta Sans",
  "Fraunces",
  "Playfair Display",
  "Lora",
];

export const DEFAULT_THEME = {
  color: "#191919",
  background: "#f7f6f3",
  accent: "#0445af",
  font: "DM Sans",
  thankYou: "Thanks for taking the time to complete this. Your response has been recorded.",
  darkMode: false,
};

export function createQuestion(type: QuestionType = "short_text"): Question {
  const options =
    type === "payment"
      ? ["10", "USD"]
      : ["multiple_choice", "dropdown"].includes(type)
        ? ["Option 1", "Option 2"]
        : [];
  return {
    type,
    title: type === "payment" ? "Complete your payment" : "Your question here",
    description: "",
    required: type === "payment",
    options,
    logic: {},
  };
}

export function choiceOptions(question: Question): string[] {
  if (question.type === "yes_no") return ["Yes", "No"];
  return question.options;
}

export function paymentAmount(question: Question): { amount: string; currency: string } {
  return {
    amount: question.options[0] || "10",
    currency: question.options[1] || "USD",
  };
}
