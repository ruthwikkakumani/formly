import { Question } from "@/lib/types";

export function OptionEditor({
  question,
  onChange,
}: {
  question: Question;
  onChange: (options: string[]) => void;
}) {
  return (
    <div className="options">
      {question.options.map((option, index) => (
        <div className="optionrow" key={index}>
          <input
            value={option}
            aria-label={`Option ${index + 1}`}
            onChange={(event) => {
              const options = [...question.options];
              options[index] = event.target.value;
              onChange(options);
            }}
          />
          {question.options.length > 2 && (
            <button
              onClick={() => onChange(question.options.filter((_, optionIndex) => optionIndex !== index))}
              aria-label="Remove option"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button onClick={() => onChange([...question.options, `Option ${question.options.length + 1}`])}>
        + Add option
      </button>
    </div>
  );
}
