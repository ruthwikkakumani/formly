import { Question } from "@/lib/types";
import { QuestionPreview } from "./QuestionPreview";

export function LivePreview({ question, index, total }: { question: Question; index: number; total: number }) {
  return (
    <section className="preview">
      <p>LIVE PREVIEW</p>
      <div className="phone">
        <small>
          {index + 1} → · {index + 1} of {total}
        </small>
        <h3>{question.title}</h3>
        {question.description && <p>{question.description}</p>}
        <QuestionPreview question={question} />
        <button>
          OK <kbd>↵</kbd>
        </button>
      </div>
    </section>
  );
}
