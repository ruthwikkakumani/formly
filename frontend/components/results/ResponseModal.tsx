import { Modal } from "@/components/shared/Modal";
import { isUploadUrl } from "@/lib/answers";
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
          <p>
            {question.id && response.answers[question.id] ? (
              isUploadUrl(response.answers[question.id]) ? (
                <a href={response.answers[question.id]} target="_blank" rel="noreferrer">
                  Open uploaded file
                </a>
              ) : (
                response.answers[question.id]
              )
            ) : (
              "—"
            )}
          </p>
        </div>
      ))}
    </Modal>
  );
}
