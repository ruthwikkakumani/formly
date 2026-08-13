import { choiceOptions } from "@/lib/constants";
import { LogicRule, Question } from "@/lib/types";

export function LogicJumpEditor({
  question,
  questions,
  selected,
  onChange,
}: {
  question: Question;
  questions: Question[];
  selected: number;
  onChange: (logic: Question["logic"]) => void;
}) {
  if (!["multiple_choice", "dropdown", "yes_no"].includes(question.type)) return null;
  const rules: LogicRule[] = question.logic?.rules?.length
    ? question.logic.rules
    : question.logic?.option
      ? [question.logic]
      : [];

  const setRules = (next: LogicRule[]) => onChange({ rules: next });

  return (
    <div className="logic">
      <b>Logic jumps</b>
      <p>Branch to another question or the thank-you screen based on the answer. Save first to jump to a newly added question.</p>
      {rules.map((rule, index) => (
        <div className="logicrule" key={index}>
          <select
            value={rule.option || ""}
            onChange={(event) => {
              const next = [...rules];
              next[index] = { ...rule, option: event.target.value };
              setRules(next);
            }}
          >
            <option value="">If answer is…</option>
            {choiceOptions(question).map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={rule.end ? "end" : rule.target_id || ""}
            onChange={(event) => {
              const next = [...rules];
              next[index] =
                event.target.value === "end"
                  ? { ...rule, end: true, target_id: "" }
                  : { ...rule, end: false, target_id: Number(event.target.value) };
              setRules(next);
            }}
          >
            <option value="">Continue normally</option>
            <option value="end">Jump to thank-you</option>
            {questions.map((item, questionIndex) =>
              questionIndex !== selected && item.id ? (
                <option value={item.id} key={item.id}>
                  Jump to {questionIndex + 1}. {item.title}
                </option>
              ) : null,
            )}
          </select>
          <button onClick={() => setRules(rules.filter((_, ruleIndex) => ruleIndex !== index))}>Remove</button>
        </div>
      ))}
      <button onClick={() => setRules([...rules, { option: "", target_id: "" }])}>+ Add jump</button>
    </div>
  );
}
