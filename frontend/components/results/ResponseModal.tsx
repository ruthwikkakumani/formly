import { Modal } from "@/components/shared/Modal";
import { FormResponse, Question } from "@/lib/types";

export function ResponseModal({
  response,
  questions,
  onClose,
}: {
  response: FormResponse;
  questions: Question[];
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">SUBMITTED {new Date(response.submitted_at).toLocaleString()}</p>
      <h2>Response details</h2>
      {questions.map((question) => (
        <div className="answer" key={question.id}>
          <b>{question.title}</b>
          <p>{(question.id && response.answers[question.id]) || "No answer"}</p>
        </div>
      ))}
    </Modal>
  );
}
