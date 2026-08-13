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
      <div className="logichead">
        <b>Logic jumps</b>
        <p>Branch to another question or the thank-you screen. Save first to jump to a newly added question.</p>
      </div>
      {rules.map((rule, index) => (
        <div className="logicrule" key={index}>
          <span className="logicif">If</span>
          <select
            aria-label="If answer is"
            value={rule.option || ""}
            onChange={(event) => {
              const next = [...rules];
              next[index] = { ...rule, option: event.target.value };
              setRules(next);
            }}
          >
            <option value="">answer is…</option>
            {choiceOptions(question).map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="logicremove"
            aria-label="Remove jump"
            onClick={() => setRules(rules.filter((_, ruleIndex) => ruleIndex !== index))}
          >
            ×
          </button>
          <span className="logicto" aria-hidden="true">
            →
          </span>
          <select
            className="logictarget"
            aria-label="Jump to"
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
        </div>
      ))}
      <button type="button" className="logicadd" onClick={() => setRules([...rules, { option: "", target_id: "" }])}>
        Add jump
      </button>
    </div>
  );
}
