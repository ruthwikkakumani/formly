import { choiceOptions } from "@/lib/constants";
import { Question } from "@/lib/types";

export function QuestionPreview({ question }: { question: Question }) {
  if (question.type === "long_text") return <div className="fakeinput multiline" />;
  if (["multiple_choice", "dropdown", "yes_no"].includes(question.type)) {
    return (
      <div className="choices">
        {choiceOptions(question).map((option, index) => (
          <span key={option}>
            <b>{String.fromCharCode(65 + index)}</b>
            {option}
          </span>
        ))}
      </div>
    );
  }
  if (question.type === "rating") return <div className="stars">☆ ☆ ☆ ☆ ☆</div>;
  if (question.type === "file_upload") return <div className="fakeinput">Choose a file</div>;
  if (question.type === "payment") {
    return (
      <div className="paycard">
        <p>
          Pay {question.options[1] || "USD"} {question.options[0] || "10"}
        </p>
        <div className="fakeinput">Card number</div>
      </div>
    );
  }
  return <div className="fakeinput" />;
}
