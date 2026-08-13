import { paymentAmount, QUESTION_TYPES } from "@/lib/constants";
import { Question, QuestionType } from "@/lib/types";
import { LogicJumpEditor } from "./LogicJumpEditor";
import { OptionEditor } from "./OptionEditor";

export function QuestionEditor({
  question,
  questions,
  selected,
  readOnly = false,
  onChange,
  onReorder,
  onRemove,
}: {
  question: Question;
  questions: Question[];
  selected: number;
  readOnly?: boolean;
  onChange: (patch: Partial<Question>) => void;
  onReorder: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const payment = paymentAmount(question);
  return (
    <aside className="qsettings">
      <p>{readOnly ? "QUESTION DETAILS" : "QUESTION SETTINGS"}</p>
      <fieldset disabled={readOnly}>
        <label className="qfield">
          Type
          <select
            value={question.type}
            onChange={(event) => {
              const type = event.target.value as QuestionType;
              onChange({
                type,
                options:
                  type === "payment"
                    ? ["10", "USD"]
                    : ["multiple_choice", "dropdown"].includes(type)
                      ? question.options.length
                        ? question.options
                        : ["Option 1", "Option 2"]
                      : [],
                logic: {},
              });
            }}
          >
            {QUESTION_TYPES.map((item) => (
              <option value={item.value} key={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {["multiple_choice", "dropdown"].includes(question.type) && (
          <OptionEditor question={question} onChange={(options) => onChange({ options })} />
        )}
        {question.type === "payment" && (
          <div className="paysettings">
            <label className="qfield">
              Amount
              <input
                type="number"
                min="1"
                value={payment.amount}
                onChange={(event) => onChange({ options: [event.target.value, payment.currency] })}
              />
            </label>
            <label className="qfield">
              Currency
              <input
                value={payment.currency}
                onChange={(event) => onChange({ options: [payment.amount, event.target.value.toUpperCase()] })}
              />
            </label>
          </div>
        )}
        <LogicJumpEditor
          question={question}
          questions={questions}
          selected={selected}
          onChange={(logic) => onChange({ logic })}
        />
        <label className="qtoggle">
          <span>Required</span>
          <input
            type="checkbox"
            checked={question.required}
            onChange={(event) => onChange({ required: event.target.checked })}
          />
        </label>
        {readOnly ? null : (
          <div className="editbottom">
            <div className="qnav">
              <button
                type="button"
                aria-label="Move question up"
                onClick={() => onReorder(selected, selected - 1)}
                disabled={selected === 0}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Move question down"
                onClick={() => onReorder(selected, selected + 1)}
                disabled={selected === questions.length - 1}
              >
                ↓
              </button>
            </div>
            <button type="button" className="qdelete" onClick={onRemove}>
              Delete
            </button>
          </div>
        )}
      </fieldset>
    </aside>
  );
}
