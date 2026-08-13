import { FormResponse, Question } from "@/lib/types";
import { displayAnswer } from "@/lib/answers";

export function ResponseTable({
  responses,
  questions,
  onOpen,
}: {
  responses: FormResponse[];
  questions: Question[];
  onOpen: (response: FormResponse) => void;
}) {
  return (
    <div className="responseTable" style={{ ["--cols" as string]: questions.length }}>
      <div className="row header">
        <span>Submitted</span>
        {questions.map((question) => (
          <span key={question.id}>{question.title}</span>
        ))}
      </div>
      {responses.map((response) => (
        <button className="row responseRow" onClick={() => onOpen(response)} key={response.id}>
          <span>{new Date(response.submitted_at).toLocaleString()}</span>
          {questions.map((question) => (
            <span key={question.id}>{displayAnswer(question.id ? response.answers[question.id] : "")}</span>
          ))}
        </button>
      ))}
    </div>
  );
}
