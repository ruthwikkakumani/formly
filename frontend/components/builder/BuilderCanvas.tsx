import { Question } from "@/lib/types";
import { QuestionPreview } from "./QuestionPreview";

export function BuilderCanvas({
  question,
  index,
  total,
  accent,
  onChange,
}: {
  question: Question;
  index: number;
  total: number;
  accent?: string;
  onChange: (patch: Partial<Question>) => void;
}) {
  return (
    <section className="canvas">
      <p className="canvasmeta" style={{ color: accent || "#0445af" }}>
        {index + 1} → · {index + 1} of {total}
      </p>
      <textarea
        className="questiontitle"
        value={question.title}
        onChange={(event) => onChange({ title: event.target.value })}
        placeholder="Type your question"
      />
      <textarea
        className="description"
        value={question.description}
        onChange={(event) => onChange({ description: event.target.value })}
        placeholder="Add a description (optional)"
      />
      <div className="canvasanswer">
        <QuestionPreview question={question} />
      </div>
      <button className="ok">
        OK <kbd>↵</kbd>
      </button>
      <small>Live preview — this is how respondents will see it</small>
    </section>
  );
}
