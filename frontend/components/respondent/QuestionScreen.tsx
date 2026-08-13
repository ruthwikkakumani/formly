import { Question } from "@/lib/types";
import { QuestionInput } from "./QuestionInput";

export function QuestionScreen({
  question,
  index,
  total,
  value,
  error,
  slug,
  direction,
  onChange,
  onNext,
}: {
  question: Question;
  index: number;
  total: number;
  value: string;
  error: string;
  slug: string;
  direction: "up" | "down";
  onChange: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <div className={`ask ${direction}`} key={question.id ?? index}>
      <h1>
        <em style={{ color: "var(--accent, #0445af)" }}>{index + 1} →</em>
        {question.title}
        {question.required && <sup>*</sup>}
      </h1>
      {question.description && <p>{question.description}</p>}
      <QuestionInput question={question} value={value} slug={slug} onChange={onChange} onCommit={onNext} />
      {error && <div className="validation">{error}</div>}
      <button className="ok" onClick={onNext}>
        OK <kbd>↵</kbd>
      </button>
      <small>press Enter ↵ or use arrow keys · letters select choices</small>
    </div>
  );
}
