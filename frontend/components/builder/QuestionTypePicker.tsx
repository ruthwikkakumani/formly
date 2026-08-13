import { QUESTION_TYPES } from "@/lib/constants";
import { QuestionType } from "@/lib/types";

export function QuestionTypePicker({ onAdd }: { onAdd: (type: QuestionType) => void }) {
  return (
    <aside className="typepicker">
      <p>ADD A QUESTION</p>
      {QUESTION_TYPES.map((item) => (
        <button onClick={() => onAdd(item.value)} key={item.value}>
          <b>{item.icon}</b>
          {item.label}
        </button>
      ))}
    </aside>
  );
}
