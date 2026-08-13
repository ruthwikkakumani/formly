import { QuestionNav } from "@/components/shared/QuestionNav";
import { Question } from "@/lib/types";
import { QuestionPreview } from "./QuestionPreview";

export function LivePreview({
  question,
  index,
  total,
  onPrev,
  onNext,
}: {
  question: Question;
  index: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <section className="preview">
      <div className="phone">
        <small>
          {index + 1} → · {index + 1} of {total}
        </small>
        <h3>{question.title}</h3>
        {question.description && <p>{question.description}</p>}
        <QuestionPreview question={question} />
        <button type="button" onClick={onNext}>
          OK <kbd>↵</kbd>
        </button>
        <p className="phonecaption">Live preview — this is how respondents will see it</p>
        {onPrev && onNext ? (
          <QuestionNav onPrev={onPrev} onNext={onNext} prevDisabled={index === 0} nextDisabled={index >= total - 1} />
        ) : null}
      </div>
    </section>
  );
}
