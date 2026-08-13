import { LogicRule, Question } from "./types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test((value || "").trim());
}

export function validateAnswer(question: Question, value: string): string | null {
  const answer = (value || "").trim();
  if (question.required && !answer) return "Please fill this in";
  if (!answer) return null;
  if (question.type === "email" && !isValidEmail(answer)) return "Enter a valid email address.";
  if (question.type === "number" && !Number.isFinite(Number(answer))) return "Please enter a number";
  if (question.type === "rating" && !["1", "2", "3", "4", "5"].includes(answer)) return "Please choose a rating from 1 to 5";
  if (question.type === "payment" && !answer.startsWith("Paid")) return "Please complete the payment to continue";
  return null;
}

function rulesFor(question: Question): LogicRule[] {
  if (question.logic?.rules?.length) return question.logic.rules;
  if (question.logic?.option) return [question.logic];
  return [];
}

export function nextIndex(questions: Question[], current: number, value: string): number | "end" {
  const question = questions[current];
  for (const rule of rulesFor(question)) {
    if (rule.option !== value) continue;
    if (rule.end) return "end";
    if (rule.target_id) {
      const target = questions.findIndex((item) => item.id === rule.target_id);
      if (target >= 0) return target;
    }
  }
  return current + 1;
}
